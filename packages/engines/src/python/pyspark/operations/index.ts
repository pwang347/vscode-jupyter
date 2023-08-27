// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import CalculateTextLength from './calculateTextLength';
import ChangeType from './changeType';
import Clone from './clone';
import ConvertToCapitalCase from './convertToCapitalCase';
import ConvertToLowercase from './convertToLowercase';
import ConvertToUppercase from './convertToUppercase';
import CreateColumnFromFormula from './createColumnFromFormula';
import CustomOperation from './customOperation';
import Drop from './drop';
import DropDuplicates from './dropDuplicates';
import DropNa from './dropNa';
import FlashFill from './flashFill';
import FillNa from './fillNa';
import Filter from './filter';
import GroupByAndAggregate from './groupByAndAggregate';
import MultiLabelTextBinarizer from './multiLabelTextBinarizer';
import OneHotEncode from './oneHotEncode';
import Rename from './rename';
import ReplaceAll from './replaceAll';
import RoundDecimals from './roundDecimals';
import RoundDown from './roundDown';
import RoundUp from './roundUp';
import Scale from './scale';
import Select from './select';
import Sort from './sort';
import SplitText from './splitText';
import StripText from './stripText';
import { OperationKey, OperationMap } from '@dw/orchestrator';

/**
 * PySpark operations.
 */
export const PySparkOperations: OperationMap = {
    ...CalculateTextLength,
    ...ChangeType,
    ...Clone,
    ...ConvertToCapitalCase,
    ...ConvertToLowercase,
    ...ConvertToUppercase,
    ...CreateColumnFromFormula,
    ...CustomOperation,
    ...Drop,
    ...DropDuplicates,
    ...DropNa,
    ...FlashFill,
    ...FillNa,
    ...Filter,
    ...GroupByAndAggregate,
    ...MultiLabelTextBinarizer,
    ...OneHotEncode,
    ...Rename,
    ...ReplaceAll,
    ...RoundDecimals,
    ...RoundDown,
    ...RoundUp,
    ...Scale,
    ...Select,
    ...Sort,
    ...SplitText,
    ...StripText,
    [OperationKey.DescribeYourOperation]: null,
    [OperationKey.FilterAndSort]: null
};
