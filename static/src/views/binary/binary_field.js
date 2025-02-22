import {patch} from "@web/core/utils/patch";
import {BinaryField} from "@web/views/fields/binary/binary_field";
import {onWillStart, onMounted, useState} from "@odoo/owl";
import {loadPDFJSAssets} from "@web/libs/pdfjs";

patch(BinaryField.prototype, {
    setup() {
        super.setup();

        this.state = useState({
            currentPage: 1,
            // Will be determined when we fetch the PDF
            totalPages: null,
            // cache of the generated PDF to avoid re-generation
            // during prev/next navigations
            pdf: null,
        });

        onWillStart(async () => {
            await loadPDFJSAssets();
            const {pdfjsLib} = globalThis;
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "/web/static/lib/pdfjs/build/pdf.worker.js";
        });

        onMounted(async () => {
            await this._initPdfViewer();
        });
    },

    _getPdfViewerCanvas() {
        return document.getElementById("oz-pdf-viewer-canvas");
    },

    async _initPdfViewer() {
        const canvas = this._getPdfViewerCanvas();
        const pdf = await this._getPdf();
        this.state.totalPages = pdf.numPages;
        await this._renderPdf(pdf, canvas);
    },

    async _getPdf() {
        const {resModel, resId} = this.props.record.model.config;
        const {name: binaryFieldName} = this.props;
        const pdfUrl = `/web/content/${resModel}/${resId}/${binaryFieldName}`;
        if (!this.state.pdf) {
            this.state.pdf = await pdfjsLib.getDocument(pdfUrl);
        }
        return this.state.pdf.promise;
    },

    async _renderPdf(pdf, canvas, pageNumber = 1) {
        try {
            if (pageNumber > this.state.totalPages) {
                // Don't render anything
                return;
            }
            console.log("pageNumber##", pageNumber);
            const page = await pdf.getPage(pageNumber);
            this.state.currentPage = pageNumber;
            const scale = 1.2;
            const viewport = page.getViewport({scale: scale});
            const context = canvas.getContext("2d");
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // render PDF page into pdfViewerCanvas context
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => console.log("pag rendered"));
        } catch (error) {
            console.log("PDF rendering error: ", error.message);
        }
        console.log("state", this.state);
    },

    async onPrevPage() {
        const canvas = this._getPdfViewerCanvas();
        const pdf = await this._getPdf();
        const prevPage = this.state.currentPage - 1;
        await this._renderPdf(pdf, canvas, prevPage);
    },

    async onNextPage() {
        const canvas = this._getPdfViewerCanvas();
        const pdf = await this._getPdf();
        const nextPage = this.state.currentPage + 1;
        await this._renderPdf(pdf, canvas, nextPage);
    },
});
