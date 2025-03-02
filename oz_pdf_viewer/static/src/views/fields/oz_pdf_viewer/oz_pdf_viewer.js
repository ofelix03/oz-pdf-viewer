/** @odoo-module **/

import {_lt} from "@web/core/l10n/translation";
import {registry} from "@web/core/registry";
import {loadJS} from "@web/core/assets";
import {onWillStart, onMounted, useState, useRef, useEffect} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
import {Component} from "@odoo/owl";
import {FileUploader} from "@web/views/fields/file_handler";

export class OzPdfViewer extends Component {
    setup() {
        super.setup();
        this.orm = useService("orm");

        this.state = useState({
            currentPage: 1,
            // Will be determined when we fetch the PDF
            totalPages: null,
            // Cache PDF when fetched for the first time to
            // avoids refetching on every prev/next navigations
            pdf: null,
        });

        this.pdfViewerRef = useRef("oz-pdf-viewer-canvas");

        onWillStart(async () => {
            await this.loadPDFJSAssets();
            const {pdfjsLib} = globalThis;
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "/web/static/lib/pdfjs/build/pdf.worker.js";
        });

        onMounted(async () => {
            this.state.componentMounted = true;
            await this._initPdfViewer();
        });

        // Clear this.state when component is destroyed
        useEffect(
            () => {
                this.state.pdf = null;
                this.state.componentMounted = false;
            },
            () => []
        );
    }

    async loadPDFJSAssets() {
        return Promise.all([
            loadJS("/web/static/lib/pdfjs/build/pdf.js"),
            loadJS("/web/static/lib/pdfjs/build/pdf.worker.js"),
        ]);
    }

    _getPdfViewerCanvas() {
        return this.pdfViewerRef.el;
    }

    _resetCanvas() {
        this.state.pdf = null;
    }

    async _initPdfViewer(pdfData) {
        const pdf = await this._getPdf(pdfData);
        if (!pdf) {
            // No PDF to render
            return;
        }
        const canvas = this._getPdfViewerCanvas();
        this.state.totalPages = pdf.numPages;
        await this._renderPdf(pdf, canvas);
    }

    async _getPdf(pdfData = null) {
        const {resModel, resId} = this.props.record;
        if (pdfData == null && resId) {
            // Fetch PDF data from the
            pdfData = await this.orm.call("oz.pdf.viewer", "get_file_data", [
                resModel,
                resId,
            ]);
        }

        if (pdfData) {
            pdfData = atob(pdfData);
            this.state.pdf = await pdfjsLib.getDocument({data: pdfData});
            return this.state.pdf;
        }
        return false;
    }

    async _renderPdf(pdf, canvas, pageNumber = 1) {
        try {
            if (pageNumber > this.state.totalPages) {
                // Page does not exist
                return;
            }
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
            await page.render(renderContext).promise;
            console.log("Page rendered");
            this.state.renderPdf = false;
        } catch (error) {
            console.log("PDF rendering error: ", error.message);
        }
    }

    async onPrevPage() {
        const canvas = this._getPdfViewerCanvas();
        const pdf = await this._getPdf();
        const prevPage = this.state.currentPage - 1;
        await this._renderPdf(pdf, canvas, prevPage);
    }

    async onNextPage() {
        const canvas = this._getPdfViewerCanvas();
        const pdf = await this._getPdf();
        const nextPage = this.state.currentPage + 1;
        await this._renderPdf(pdf, canvas, nextPage);
    }

    onFileUploaded({data, name, objectUrl}) {
        this.update({data, name});
        this._initPdfViewer(data);
    }

    onFileRemove() {
        this.state.pdf = null;
        this.update({});
    }

    update({data, name}) {
        const changes = {[this.props.name]: data || false};
        const {fileNameField, record} = this.props;
        if (fileNameField in record.fields && record.data[fileNameField] !== name) {
            changes[fileNameField] = name || false;
        }
        return this.props.record.update(changes);
    }
}

OzPdfViewer.template = "oz_pdf_viewer.PdfViewer";
OzPdfViewer.components = {
    FileUploader,
};
OzPdfViewer.props = {
    ...standardFieldProps,
    fileNameField: {type: String, optional: true},
};
OzPdfViewer.displayName = _lt("Oz PDF Viewer");
OzPdfViewer.supportedTypes = ["binary"];

OzPdfViewer.extractProps = ({attrs}) => {
    return {
        fileNameField: attrs.filename,
    };
};

registry.category("fields").add("oz_pdf_viewer", OzPdfViewer);
