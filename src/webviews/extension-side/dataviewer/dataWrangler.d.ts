/* eslint-disable @typescript-eslint/no-explicit-any */
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Uri } from 'vscode';
// TODO@DW: we should make the contracts standalone so that this file could be dropped into other projects
import type { KernelConnectionMetadataWithKernelSpecs } from '../kernel/vscode-jupyter/types';
import type { JupyterTypes } from '../../../types/external/jupyterTypes';
import { IVariableImportOperationArgs } from '@dw/engines/lib/core/operations/dataImport/variable';

type UncapitalizeKeys<T> = {
    [K in keyof T as Uncapitalize<string & K>]: T[K];
};

/**
 * The configuration of the variables for Data Wrangler operations.
 */
export type IVariableImportOperationConfig = Partial<UncapitalizeKeys<IVariableImportOperationArgs>> & {
    variableName: string;
};

/**
 * Options for launching the Data Wrangler using the contract API.
 */
export interface ILaunchDataWranglerUsingVariableOptions {
    notebookUri: Uri;
    variableConfig: IVariableImportOperationConfig;
    session: {
        metadata: KernelConnectionMetadataWithKernelSpecs;
        connection: JupyterTypes.IKernelConnectionInfo;
    };
    exportLocation?: {
        cellUri: Uri;
    };
}

/**
 * Data Wrangler extension exports.
 */
export interface IDataWranglerExtensionAPI {
    /**
     * Promise indicating whether all parts of the extension have completed loading or not.
     * @type {Promise<void>}
     * @memberof IDataWranglerExtensionAPI
     */
    ready: Promise<void>;

    /**
     * Launches the Data Wrangler using the given variable name.
     */
    launchDataWranglerUsingVariable: (options: ILaunchDataWranglerUsingVariableOptions) => Promise<void>;
}
