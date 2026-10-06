const express = require("express");

const router = express.Router();

const invoiceController = require("../controllers/invoiceController");

router.get(
    "/",
    invoiceController.getInvoices
);

router.post(
    "/",
    invoiceController.createInvoice
);

router.put(
    "/:invoiceId",
    invoiceController.updateInvoice
);

router.get(
    "/:invoiceId/download",
    invoiceController.downloadInvoicePDF
);

router.delete(
    "/:invoiceId",
    invoiceController.deleteInvoice
);

router.post(
    "/:invoiceId/send-whatsapp",
    invoiceController.sendInvoiceToWhatsApp
);

module.exports = router;