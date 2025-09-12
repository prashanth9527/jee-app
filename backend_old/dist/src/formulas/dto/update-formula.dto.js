"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFormulaDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_formula_dto_1 = require("./create-formula.dto");
class UpdateFormulaDto extends (0, mapped_types_1.PartialType)(create_formula_dto_1.CreateFormulaDto) {
}
exports.UpdateFormulaDto = UpdateFormulaDto;
//# sourceMappingURL=update-formula.dto.js.map