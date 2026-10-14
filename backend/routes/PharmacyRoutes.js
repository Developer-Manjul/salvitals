const express = require("express");
const router = express.Router();

const pharmacyController = require("../controllers/pharmacyController");

router.get("/", pharmacyController.getMedicines);
router.post("/", pharmacyController.createMedicine);
router.put("/:medicineId", pharmacyController.updateMedicine);
router.delete("/:medicineId", pharmacyController.deleteMedicine);
router.post("/import", pharmacyController.importMedicines);

module.exports = router;