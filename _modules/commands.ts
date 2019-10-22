const commands = {
    deploy: {
        command:     "deploy",
        description: "Deploy various application types",
    },
    dotnetTest: {
        command:     "dotnet-test",
        description: "Run various dotnet test runner commands for the project",
    },
    dotnet: {
        command:     "dotnet",
        description: "Run various dotnet commands for the project",
    },
    install: {
        command:     "install",
        description: "Collection of commands related to installation and configuration of the and-cli",
    },
    migration: {
        command:     "migration",
        description: "Run commands to manage Entity Framework migrations",
    },
    nuget: {
        command:     "nuget",
        description: "Manages publishing of nuget dotnet core projects",
    },
};

export default commands;