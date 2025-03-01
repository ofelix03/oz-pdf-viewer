import {patch} from "@web/core/utils/patch";
import {_t} from "@web/core/l10n/translation";
import {registry} from "@web/core/registry";
import {BinaryField, binaryField} from "@web/views/fields/binary/binary_field";
import {onWillStart, onMounted, useState, useRef} from "@odoo/owl";
import {useService} from "@web/core/utils/hooks";
import {loadPDFJSAssets} from "@web/libs/pdfjs";
import {standardFieldProps} from "@web/views/fields/standard_field_props";
import {Component} from "@odoo/owl";

export class OzPdfViewer extends Component {
    static template = "oz_pdf_viewer.PdfViewer";
    // static components = {};
    static props = {
        ...standardFieldProps,
    };

    setup() {
        super.setup();
        this.orm = useService("orm");

        this.state = useState({
            currentPage: 1,
            // Will be determined when we fetch the PDF
            totalPages: null,
            // Cache PDF binary when fetched for the first time and
            // avoids refetching on every prev/next navigations
            pdf: null,
        });

        this.pdfViewerRef = useRef("oz-pdf-viewer-canvas");

        onWillStart(async () => {
            await loadPDFJSAssets();
            const {pdfjsLib} = globalThis;
            pdfjsLib.GlobalWorkerOptions.workerSrc =
                "/web/static/lib/pdfjs/build/pdf.worker.js";
        });

        console.log("props##", this.props);

        onMounted(async () => {
            await this._initPdfViewer();
        });
    }

    _getPdfViewerCanvas() {
        return this.pdfViewerRef.el;
    }

    async _initPdfViewer() {
        const pdf = await this._getPdf();
        if (!pdf) {
            // No PDF to render
            return;
        }
        const canvas = this._getPdfViewerCanvas();
        this.state.totalPages = pdf.numPages;
        await this._renderPdf(pdf, canvas);
    }

    async _getPdf() {
        const {resModel, resId} = this.props.record.model.config;
        let pdfData = await this.orm.call("ir.attachment", "get_file_base64encoded", [
            resModel,
            resId,
        ]);
        pdfData = Uint8Array.fromBase64(pdfData);
        if (!resId) {
            return false;
        }
        if (!this.state.pdf) {
            this.state.pdf = await pdfjsLib.getDocument(pdfData);
        }
        return this.state.pdf.promise;
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
            const renderTask = page.render(renderContext);
            renderTask.promise.then(() => console.log("pag rendered"));
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
}

export const ozPdfViewer = {
    component: OzPdfViewer,
    displayName: _t("Oz PDF Viewer"),
    supportedOptions: [
        {
            label: _t("Preview image"),
            name: "preview_image",
            type: "field",
            availableTypes: ["binary"],
        },
    ],
};

registry.category("fields").add("oz_pdf_viewer", ozPdfViewer);

// patch(BinaryField.prototype, {
//     setup() {
//         super.setup();

//         this.state = useState({
//             currentPage: 1,
//             // Will be determined when we fetch the PDF
//             totalPages: null,
//             // Cache PDF binary when fetched for the first time and
//             // avoids refetching on every prev/next navigations
//             pdf: null,
//         });

//         onWillStart(async () => {
//             await loadPDFJSAssets();
//             const {pdfjsLib} = globalThis;
//             pdfjsLib.GlobalWorkerOptions.workerSrc =
//                 "/web/static/lib/pdfjs/build/pdf.worker.js";
//         });

//         onMounted(async () => {
//             await this._initPdfViewer();
//         });
//     },

//     _getPdfViewerCanvas() {
//         return document.getElementById("oz-pdf-viewer-canvas");
//     },

//     async _initPdfViewer() {
//         const pdf = await this._getPdf();
//         if (!pdf) {
//             // No PDF to render
//             return;
//         }
//         const canvas = this._getPdfViewerCanvas();
//         this.state.totalPages = pdf.numPages;
//         await this._renderPdf(pdf, canvas);
//     },

//     async _getPdf() {
//         const {resModel, resId} = this.props.record.model.config;
//         const {name: binaryFieldName} = this.props;
//         if (!resId) {
//             return false;
//         }
//         const pdfUrl = `/web/content/${resModel}/${resId}/${binaryFieldName}`;
//         if (!this.state.pdf) {
//             this.state.pdf = await pdfjsLib.getDocument(pdfUrl);
//         }
//         return this.state.pdf.promise;
//     },

//     async _renderPdf(pdf, canvas, pageNumber = 1) {
//         try {
//             if (pageNumber > this.state.totalPages) {
//                 // Page does not exist
//                 return;
//             }
//             const page = await pdf.getPage(pageNumber);
//             this.state.currentPage = pageNumber;
//             const scale = 1.2;
//             const viewport = page.getViewport({scale: scale});
//             const context = canvas.getContext("2d");
//             canvas.height = viewport.height;
//             canvas.width = viewport.width;

//             // render PDF page into pdfViewerCanvas context
//             const renderContext = {
//                 canvasContext: context,
//                 viewport: viewport,
//             };
//             const renderTask = page.render(renderContext);
//             renderTask.promise.then(() => console.log("pag rendered"));
//         } catch (error) {
//             console.log("PDF rendering error: ", error.message);
//         }
//     },

//     async onPrevPage() {
//         const canvas = this._getPdfViewerCanvas();
//         const pdf = await this._getPdf();
//         const prevPage = this.state.currentPage - 1;
//         await this._renderPdf(pdf, canvas, prevPage);
//     },

//     async onNextPage() {
//         const canvas = this._getPdfViewerCanvas();
//         const pdf = await this._getPdf();
//         const nextPage = this.state.currentPage + 1;
//         await this._renderPdf(pdf, canvas, nextPage);
//     },
// });

// const binaryField = {
//     ...binaryField,
//     supportedOptions: [
//         {
//             label: _t("Inline Preview"),
//             name: "inline_preview",
//             type: "boolean",
//         },
//     ],
//     extractProps: ({attrs, options}) => ({
//         inlinePreview: options.inline_preview,
//     }),
// };
