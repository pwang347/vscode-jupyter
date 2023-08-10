import { IDataFrameRow } from "@dw/messaging";

/**
 * Default number of rows needed for PROSE operations.
 */
export const DefaultProseExamplesCount = 1000;

/**
 * Client to access PROSE API.
 */
export interface IProseApiClient {
    deriveColumn: (
        engineId: string,
        enginesToTranslateTo: string[],
        schema: { [key: string]: string },
        examples: IProseExample[],
        additionalInputs: Array<{ [key: string]: any }>,
        derivedColumnName: string,
        dataFrameName: string,
        dervicedColumnIndex: number
    ) => Promise<DeriveColumnResult>;
}

/**
 * A PROSE example.
 */
export interface IProseExample {
    input: { [key: string]: any };
    output: any;
}

/**
 * Types of derive column errors
 */
export enum DeriveColumnError {
    TimedOutError = "TimedOutError",
    NoProgramLearnedError = "NoProgramLearnedError",
    TranslationFailedError = "TranslationFailedError",
    UnsupportedEngineError = "UnsupportedEngineError",
    CommunicationError = "CommunicationError"
}

/**
 * Types of derive column errors
 */
export const DeriveColumnErrorMap: { [key: string]: DeriveColumnError } = {
    "System.TimeoutException": DeriveColumnError.TimedOutError,
    "DataWrangler.PROSE.Common.NoProgramLearnedException": DeriveColumnError.NoProgramLearnedError,
    "DataWrangler.PROSE.Common.TranslationFailedException": DeriveColumnError.TranslationFailedError,
    "DataWrangler.PROSE.Common.UnsupportedEngineException": DeriveColumnError.UnsupportedEngineError
};

/**
 * Response for a derive column call.
 */
export type DeriveColumnResult =
    | {
          success: true;
          derivedProgram: string;
          derivedPrograms: { [engineId: string]: string };
          significantInputs: number[];
          columnsUsed: string[];
      }
    | {
          success: false;
          errorCode: DeriveColumnError;
      };
