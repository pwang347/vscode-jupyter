// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { inject, injectable } from 'inversify';
import { CancellationToken, WebviewView, WebviewViewResolveContext } from 'vscode';
import { IDataWranglerOrchestrator, ISummaryViewProvider } from './types';
import { SummaryView } from './summaryView';
import { IConfigurationService, IDisposableRegistry, IExtensionContext } from '../../../platform/common/types';
import { IWebviewViewProvider, IWorkspaceService } from '../../../platform/common/application/types';

// This class creates our UI for our variable view and links it to the vs code webview view
@injectable()
export class SummaryViewProvider implements ISummaryViewProvider {
    public readonly viewType = 'jupyter-summary-view';
    private summaryView?: SummaryView;

    constructor(
        @inject(IDataWranglerOrchestrator) private readonly dwOrchestrator: IDataWranglerOrchestrator,
        @inject(IConfigurationService) private readonly configuration: IConfigurationService,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
        @inject(IWebviewViewProvider) private readonly webviewViewProvider: IWebviewViewProvider,
        @inject(IExtensionContext) private readonly context: IExtensionContext,
        @inject(IDisposableRegistry) private readonly disposables: IDisposableRegistry
    ) {}

    public async resolveWebviewView(
        webviewView: WebviewView,
        _context: WebviewViewResolveContext,
        _token: CancellationToken
    ): Promise<void> {
        webviewView.webview.options = { enableScripts: true };
        // Create our actual variable view
        this.summaryView = new SummaryView(
            this.dwOrchestrator,
            this.configuration,
            this.workspaceService,
            this.webviewViewProvider,
            this.context,
            this.disposables
        );
        await this.summaryView.load(webviewView);
    }
}
