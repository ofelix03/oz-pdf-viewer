This module is very similar to the standard Odoo "PDF Viewer" widget. However, this widget `oz_pdf_viewer` presents itself in the use case where the security and controlled accessibility of the PDF is essential.

## Screenshots
**An editable binary field with `oz_pdf_viewer` widget**
![v16 - screenshot 1](https://github.com/user-attachments/assets/09b8d7a9-11f0-4ec8-9691-4d6d33fe9afb)

**Basic navigation actions on `oz_pdf_viewer` rendered PDFs**
![v16 - screenshot 2](https://github.com/user-attachments/assets/9e20eab8-f5f0-4bc1-9fae-293f1449d1b8)

**Readonly binary field with `oz_pdf_viewer` widget**
![v16 - screenshot 2 - readonly](https://github.com/user-attachments/assets/a67fbfbd-4b92-4878-bf17-c01d859c09e3)


## When to use `oz_pdf_viewer` instead of `pdf_viewer` widget
While both widget Odoo standard `pdf_viewer` and this custom widget `oz_pdf_viewer` utilizes PDF.js library in fetching and rendering the PDF, they achieve this objective differently. 
 
### Odoo `pdf_viewer` widget 
Fetches the PDF document via the web endpoint `/web/content/....`

### Custom `oz_pdf_viewer` widget 
Fetches the PDF documetn using the Odoo ORM service, constraining the possibility of retrieving the PDF outside the Odoo application.

These two screenshots below highlights the main difference betweeen `oz_pdf_viewer` and `pdf_viewer`. The clear difference is in use case, `oz_pdf_viewer` emphasizes and ensures PDF security and accessibility.
**Odoo's `pdf_viewer` renders a PDF which remains accessible only by copying and pasting the highlighted PDF URL in another tab, even outside the workflow of the intended application.**
![PDF STILL ACCESSIBLE VIA BROWSER DEV TOOL](https://github.com/user-attachments/assets/ae217cf1-7bda-49eb-b576-4ba04d1d6be3)

**Custom `oz_pdf_viewer` widget rendered PDFs are *ONLY* accessible within the workflow of the intended application, and can not be accessed in any other way**
![PDF Secured](https://github.com/user-attachments/assets/dff94a7e-2158-4485-9c76-ac13e0cacd31)

