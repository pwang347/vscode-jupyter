// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { IDisposable } from '../../../platform/common/types';
import { CodeOutputStreamListener } from '@dw/messaging';
import { Kernel } from '@jupyterlab/services';
import { KernelConnectionMetadata, LiveRemoteKernelConnectionMetadata } from '../../../api';

// import { SharedMessages } from '../../../messageTypes';

/**
 * This allows us to bypass the fact that kernelSpecs is not present on LiveRemoteKernelConnectionMetadata
 */
export type KernelConnectionMetadataWithKernelSpecs =
    | Exclude<KernelConnectionMetadata, LiveRemoteKernelConnectionMetadata>
    | (LiveRemoteKernelConnectionMetadata & { kernelSpec: undefined });

export interface IKernelSession extends IDisposable {
    id: string;
    name: string;
    // type: KernelSessionType;
    executeCode: (
        code: string,
        options?: {
            outputStream?: CodeOutputStreamListener;
        }
    ) => Promise<string>;
    interrupt: () => Promise<void>;
    onStatusChanged: vscode.Event<Kernel.Status>;
}
