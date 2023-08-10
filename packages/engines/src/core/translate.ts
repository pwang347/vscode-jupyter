import {
    IDataWranglerOperationArgContext,
    IDataWranglerOperationContext,
    IGenericOperation,
    IOperationBaseProgramGenResult,
    LocalizedStrings,
    IGenericDataImportOperation,
    IWranglerStartSessionContext,
    IDataImportOperationBaseProgramGenResult,
    OperationCodeGenResultType,
    IOperationWithBaseProgram,
    IDataImportOperationWithBaseProgram,
    IBaseProgram,
    IOperationWithBaseProgramResult,
    IDataImportOperationWithBaseProgramResult,
    IOperationWithBaseProgramContext,
    IDataImportOperationWithBaseProgramContext
} from "@dw/orchestrator";
import { IOperationArgView, TranslationValidationResult } from "@dw/messaging";

export function extendBaseOperation<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TConfig extends { [key: string]: any } = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
>(
    getOperation: (config: TConfig) => IGenericOperation<TArgs, TBaseProgram, TLocType>,
    options: {
        config?: TConfig;
        postProcessArgs?: (args: IOperationArgView[]) => IOperationArgView[];
        postProcessBaseProgramGeneration?: (
            ctx: IDataWranglerOperationContext<TArgs, TLocType>,
            result: IOperationBaseProgramGenResult<TBaseProgram, TArgs>
        ) => Promise<IOperationBaseProgramGenResult<TBaseProgram, TArgs>>;
        translateBaseProgram: (
            ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
        ) => IOperationWithBaseProgramResult;
        validateBaseProgram?: (
            ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
        ) => TranslationValidationResult;
        isTranslationSupported?: boolean;
    }
): IOperationWithBaseProgram<TArgs, TBaseProgram, TLocType> {
    const operation = getOperation(options?.config ?? ({} as TConfig));
    const generateBaseProgram = async (ctx: IDataWranglerOperationContext<TArgs, TLocType>) => {
        const result = await operation.generateBaseProgram(ctx);
        if (options.postProcessBaseProgramGeneration) {
            return options.postProcessBaseProgramGeneration(ctx, result);
        }
        return result;
    };
    return {
        ...operation,
        getArgs: operation.getArgs
            ? (ctx: IDataWranglerOperationArgContext<TLocType>) => {
                  const args = operation.getArgs!(ctx);
                  if (options.postProcessArgs) {
                      return options.postProcessArgs(args);
                  }
                  return args;
              }
            : undefined,
        generateCodeFromBaseProgram: options.translateBaseProgram,
        validateBaseProgram: options.validateBaseProgram,
        generateCode: async (ctx) => {
            const genResult = await generateBaseProgram(ctx);
            if (genResult.result === OperationCodeGenResultType.Success) {
                if (!genResult.getBaseProgram) {
                    throw new Error("Base program generator does not exist for generic operation");
                }
                const baseProgram = genResult.getBaseProgram();
                const generateCodeResult = await options.translateBaseProgram({
                    originalEngineName: ctx.engineName,
                    baseProgram,
                    getLocalizedStrings: ctx.getLocalizedStrings,
                    formatString: ctx.formatString
                });
                return {
                    ...genResult,
                    ...generateCodeResult,
                    getBaseProgram: () => baseProgram
                };
            }
            return genResult;
        },
        isTranslationSupported: options.isTranslationSupported ?? operation.isTranslationSupported
    };
}

export function extendBaseDataImportOperation<
    TArgs extends { [key: string]: any } = any,
    TBaseProgram extends IBaseProgram = any,
    TConfig extends { [key: string]: any } = any,
    TLocType extends typeof LocalizedStrings.Orchestrator = typeof LocalizedStrings.Orchestrator
>(
    getOperation: (config: TConfig) => IGenericDataImportOperation<TArgs, TBaseProgram, TLocType>,
    options: {
        config?: TConfig;
        postProcessArgs?: (args: IOperationArgView[]) => IOperationArgView[];
        postProcessBaseProgramGeneration?: (
            ctx: IWranglerStartSessionContext<TArgs, TLocType>,
            result: IDataImportOperationBaseProgramGenResult<TBaseProgram>
        ) => Promise<IDataImportOperationBaseProgramGenResult<TBaseProgram>>;
        translateBaseProgram: (
            ctx: IDataImportOperationWithBaseProgramContext<TBaseProgram, TLocType>
        ) => IDataImportOperationWithBaseProgramResult;
        validateBaseProgram?: (
            ctx: IOperationWithBaseProgramContext<TBaseProgram, TLocType>
        ) => TranslationValidationResult;
        isTranslationSupported?: boolean;
    }
): IDataImportOperationWithBaseProgram<TArgs, TBaseProgram, TLocType> {
    const operation = getOperation(options?.config ?? ({} as TConfig));
    const generateBaseProgram = async (ctx: IWranglerStartSessionContext<TArgs, TLocType>) => {
        const result = await operation.generateBaseProgram(ctx);
        if (options.postProcessBaseProgramGeneration) {
            return options.postProcessBaseProgramGeneration(ctx, result);
        }
        return result;
    };
    return {
        ...operation,
        getArgs: operation.getArgs
            ? (ctx: IDataWranglerOperationArgContext<TLocType>) => {
                  const args = operation.getArgs!(ctx);
                  if (options.postProcessArgs) {
                      return options.postProcessArgs(args);
                  }
                  return args;
              }
            : undefined,
        generateCodeFromBaseProgram: options.translateBaseProgram,
        validateBaseProgram: options.validateBaseProgram,
        generateCode: async (ctx) => {
            const genResult = await generateBaseProgram(ctx);
            if (genResult.result === OperationCodeGenResultType.Success) {
                if (!genResult.getBaseProgram) {
                    throw new Error("Base program generator does not exist for generic data import operation");
                }
                const baseProgram = genResult.getBaseProgram();
                const codeGenResult = await options.translateBaseProgram({
                    originalEngineName: ctx.engineName,
                    baseProgram,
                    getLocalizedStrings: ctx.getLocalizedStrings,
                    formatString: ctx.formatString
                });
                return {
                    ...genResult,
                    ...codeGenResult,
                    getBaseProgram: () => baseProgram
                };
            }
            return genResult;
        },
        isTranslationSupported: options.isTranslationSupported ?? operation.isTranslationSupported
    };
}
