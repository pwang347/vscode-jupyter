import calculateTextLength from "./calculateTextLength";
import capitalizeText from "./convertToCapitalCase";
import changeType from "./changeType";
import operationByDescription from "./describeYourOperation";
import clone from "./clone";
import convertToLowercase from "./convertToLowercase";
import convertToUppercase from "./convertToUppercase";
import drop from "./drop";
import dropDuplicates from "./dropDuplicates";
import dropNa from "./dropNa";
import fillNa from "./fillNa";
import filter from "./filter";
import flashFill from "./flashFill";
import groupByAndAggregate from "./groupByAndAggregate";
import oneHotEncode from "./oneHotEncode";
import multiLabelTextBinarizer from "./multiLabelTextBinarizer";
import rename from "./rename";
import replaceAll from "./replaceAll";
import roundDecimals from "./roundDecimals";
import roundDown from "./roundDown";
import roundUp from "./roundUp";
import scale from "./scale";
import select from "./select";
import sort from "./sort";
import splitText from "./splitText";
import stripText from "./stripText";
import createColumnFromFormula from "./createColumnFromFormula";
import customOperation from "./customOperation";
import { OperationMap } from "@dw/orchestrator";

/**
 * Pandas operations.
 */
export const PandasOperations: OperationMap = {
    ...operationByDescription,
    ...changeType,
    ...capitalizeText,
    ...clone,
    ...convertToLowercase,
    ...convertToUppercase,
    ...drop,
    ...dropDuplicates,
    ...dropNa,
    ...fillNa,
    ...filter,
    ...flashFill,
    ...groupByAndAggregate,
    ...multiLabelTextBinarizer,
    ...oneHotEncode,
    ...calculateTextLength,
    ...rename,
    ...replaceAll,
    ...roundDecimals,
    ...roundDown,
    ...roundUp,
    ...scale,
    ...select,
    ...sort,
    ...splitText,
    ...stripText,
    ...createColumnFromFormula,
    ...customOperation
};
