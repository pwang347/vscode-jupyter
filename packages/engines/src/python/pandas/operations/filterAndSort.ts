// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { OperationKey } from '@dw/orchestrator';
import { extendBaseOperation } from '../../../core/translate';
import { FilterAndSortOperationBase } from '../../../core/operations/filterAndSort';
import FilterOperation from './filter';
import SortOperation from './sort';

export default {
    [OperationKey.FilterAndSort]: extendBaseOperation(FilterAndSortOperationBase, {
        translateBaseProgram: (ctx) => {
            const { filter, sort } = ctx.baseProgram;
            const filterCode = filter
                ? FilterOperation.Filter.generateCodeFromBaseProgram({ ...ctx, baseProgram: filter }).getCode('en')
                : '';
            const sortCode = sort
                ? SortOperation.Sort.generateCodeFromBaseProgram({ ...ctx, baseProgram: sort }).getCode('en')
                : '';
            return {
                getCode: () => filterCode + '\n' + sortCode
            };
        }
    })
};
