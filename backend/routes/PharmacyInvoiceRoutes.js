const express = require("express");
const router = express.Router();

const pharmacyInvoiceController = require("../controllers/pharmacyInvoiceController");

router.get("/", pharmacyInvoiceController.getInvoices);
router.post("/", pharmacyInvoiceController.createInvoice);

router.get(
    "/:invoiceId/download",
    pharmacyInvoiceController.downloadInvoicePDF
);

router.post(
    "/:invoiceId/whatsapp",
    pharmacyInvoiceController.sendInvoiceToWhatsApp
);

router.get("/:invoiceId", pharmacyInvoiceController.getInvoiceById);
router.put("/:invoiceId", pharmacyInvoiceController.updateInvoice);
router.delete("/:invoiceId", pharmacyInvoiceController.deleteInvoice);

module.exports = router;