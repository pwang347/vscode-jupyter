/**
 * Map of satisfied and unsatisfied package dependencies.
 * Note that the format of the versioning depends on the engine, but for the purposes of the UI generally it is fine
 * to treat it as a string for display purposes (whether for error messages or otherwise).
 */
export interface IResolvedPackageDependencyMap {
    // these packages are >= the required versions
    satisfied: {
        [packageName: string]: ISatisfiedPackageDependency;
    };
    // these packages are < the required versions or are undefined
    unsatisfied: {
        [packageName: string]: IPackageDependency;
    };
}

/**
 * State of a package dependency.
 */
export interface IPackageDependency {
    installedVersion: string | undefined;
    requiredVersion: string;
}

/**
 * State of a satisfied package dependency.
 */
export interface ISatisfiedPackageDependency extends IPackageDependency {
    installedVersion: string;
}

/**
 * A dependency to install.
 */
export interface IDependencyToInstall {
    packageName: string;
    version?: string;
}
