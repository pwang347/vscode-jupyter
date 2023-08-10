import { ArgType } from "@dw/messaging";
import { ArgsRendererMap } from "./types";
import IntegerArgsRenderer from "./integerArgsRenderer";
import StringArgsRenderer from "./stringArgsRenderer";
import ArgGroupArgsRenderer from "./argGroupArgsRenderer";
import BooleanArgsRenderer from "./booleanArgsRenderer";
import CategoryArgsRenderer from "./categoryArgsRenderer";
import DateTimeArgsRenderer from "./dateTimeArgsRenderer";
import FloatArgsRenderer from "./floatArgsRenderer";
import TargetArgsRenderer from "./targetArgsRenderer";
import TimeDeltaArgsRenderer from "./timeDeltaArgsRenderer";
import TypeDependentArgsRenderer from "./typeDependentArgsRenderer";
import VariableColumnArgsRenderer from "./variableColumnArgsRenderer";
import FormulaArgsRenderer from "./formulaRenderer";

const rendererMap: ArgsRendererMap = {
    [ArgType.ArgGroup]: ArgGroupArgsRenderer,
    [ArgType.Boolean]: BooleanArgsRenderer,
    [ArgType.Category]: CategoryArgsRenderer,
    [ArgType.Datetime]: DateTimeArgsRenderer,
    [ArgType.Float]: FloatArgsRenderer,
    [ArgType.Integer]: IntegerArgsRenderer,
    [ArgType.String]: StringArgsRenderer,
    [ArgType.Target]: TargetArgsRenderer,
    [ArgType.Timedelta]: TimeDeltaArgsRenderer,
    [ArgType.TypeDependent]: TypeDependentArgsRenderer,
    [ArgType.VariableColumnType]: VariableColumnArgsRenderer,
    [ArgType.Formula]: FormulaArgsRenderer
};
export default rendererMap;
