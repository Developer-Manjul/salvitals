const express = require("express");

const router = express.Router();

const invoiceController =
    require("../controllers/invoiceController");


/* =========================================
   GET ALL INVOICES
========================================= */

router.get(
    "/",
    invoiceController.getInvoices
);


/* =========================================
   CREATE INVOICE
========================================= */

router.post(
    "/",
    invoiceController.createInvoice
);


/* =========================================
   DELETE INVOICE
========================================= */

router.delete(
    "/:invoiceId",
    invoiceController.deleteInvoice
);


/* =========================================
   SEND INVOICE ON WHATSAPP
========================================= */

router.post(
    "/:invoiceId/send-whatsapp",
    invoiceController.sendInvoiceToWhatsApp
);


module.exports = router;