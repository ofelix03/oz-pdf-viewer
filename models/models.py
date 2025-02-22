# -*- coding: utf-8 -*-

from odoo import models, fields, api


class OzDocument(models.Model):
    _name = "oz.document"
    _description = "Document"

    name = fields.Char(required=True)
    doc_file = fields.Binary(required=True)
