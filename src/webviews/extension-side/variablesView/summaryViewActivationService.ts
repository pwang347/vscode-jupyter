// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import { window } from 'vscode';
import { IExtensionSyncActivationService } from '../../../platform/activation/types';
import { IExtensionContext } from '../../../platform/common/types';
import { ISummaryViewProvider } from './types';

// Responsible for registering our Native Notebook variable view
@injectable()
export class SummaryViewActivationService implements IExtensionSyncActivationService {
    constructor(
        @inject(IExtensionContext) private extensionContext: IExtensionContext,
        @inject(ISummaryViewProvider) private summaryViewProvider: ISummaryViewProvider
    ) {}

    public activate() {
        this.extensionContext.subscriptions.push(
            window.registerWebviewViewProvider(this.summaryViewProvider.viewType, this.summaryViewProvider, {
                webviewOptions: { retainContextWhenHidden: false }
            })
        );
    }
}
