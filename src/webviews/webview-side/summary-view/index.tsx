// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// This must be on top, do not change. Required by webpack.
import '../common/main';
// This must be on top, do not change. Required by webpack.

// eslint-disable-next-line import/order
import '../common/index.css';

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { IVsCodeApi } from '../react-common/postOffice';
import { SummaryViewPanel } from './summaryViewPanel';

// This special function talks to vscode from a web panel
export declare function acquireVsCodeApi(): IVsCodeApi;

/* eslint-disable  */
ReactDOM.render(
    <SummaryViewPanel />,
    document.getElementById('root') as HTMLElement
);
