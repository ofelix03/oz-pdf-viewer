from odoo import models, api
from base64 import b64encode


class OzPdfViewer(models.TransientModel):
    _name = "oz.pdf.viewer"
    _description = "Oz PDF Viewer"

    @api.model
    def get_file_base64encoded(self, res_model, res_id):
        """Returns base64 encoded data of the attachment"""
        if res_model and res_id:
            query = """
                select id
                from ir_attachment
                where res_model = %s
                and res_id = %s
                limit 1
            """
            self.env.cr.execute(query, [res_model, res_id])
            result = self.env.cr.fetchone()
            attachment = self.env["ir.attachment"].browse(result and result[0])
            return attachment.datas
        return ""
