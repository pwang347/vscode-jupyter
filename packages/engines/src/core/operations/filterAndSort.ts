// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
    LocalizedStrings,
    OperationCategory,
    OperationCodeGenResultType,
    PreviewStrategy,
    IGenericOperation
} from '@dw/orchestrator';
import { FilterOperationBase, IFilterBaseProgram, IFilterOperationArgs } from './filter';
import { ISortBaseProgram, ISortOperationArgs, SortOperationBase } from './sort';

type IFilterAndSortOperationArgs = {
    filter: IFilterOperationArgs;
    sort: ISortOperationArgs;
};
type IFilterAndSortBaseProgram = {
    variableName: string;
    filter?: IFilterBaseProgram;
    sort?: ISortBaseProgram;
};

/**
 * Base operation to filter columns.
 */
export const FilterAndSortOperationBase: () => IGenericOperation<
    IFilterAndSortOperationArgs,
    IFilterAndSortBaseProgram,
    typeof LocalizedStrings.Orchestrator
> = () => ({
    category: OperationCategory.SortAndFilter,
    generateBaseProgram: async (ctx) => {
        const filter = await FilterOperationBase().generateBaseProgram({ ...ctx, args: ctx.args.filter });
        const sort = await SortOperationBase().generateBaseProgram({ ...ctx, args: ctx.args.sort });
        // if (filter.result !== OperationCodeGenResultType.Success) {
        //     return {
        //         result: OperationCodeGenResultType.Failure
        //     };
        // }
        // if (sort.result !== OperationCodeGenResultType.Success) {
        //     return {
        //         result: OperationCodeGenResultType.Failure
        //     };
        // }
        return {
            getBaseProgram: () => {
                const filterBaseProgram =
                    filter.result !== OperationCodeGenResultType.Success ? undefined : filter.getBaseProgram!();
                const sortBaseProgram =
                    sort.result !== OperationCodeGenResultType.Success ? undefined : sort.getBaseProgram!();
                return {
                    variableName: ctx.variableName,
                    filter: filterBaseProgram,
                    sort: sortBaseProgram
                };
            },
            getDescription: () => '',
            previewStrategy: PreviewStrategy.None,
            result: OperationCodeGenResultType.Success
        };
    },
    getArgs: () => []
});
