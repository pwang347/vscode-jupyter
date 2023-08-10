module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    transformIgnorePatterns: ["\\.(css|scss|sass)$"],
    moduleNameMapper: {
        "\\.(css|scss|sass)$": "identity-obj-proxy"
    }
};
