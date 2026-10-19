const errorResponse = {
    description: "Server error",
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    error: { type: "string" }
                }
            }
        }
    }
};

const jsonBody = (properties, required = []) => ({
    required: true,
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties,
                required
            }
        }
    }
});

const openapi = {
    openapi: "3.0.3",
    info: {
        title: "Smart Lamp API",
        version: "1.0.0",
        description: "REST API documentation for the Smart Lamp application."
    },
    servers: [{ url: "/" }],
    tags: [
        { name: "Health" },
        { name: "Presets" },
        { name: "Lamp" },
        { name: "Sensors" }
    ],
    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Check application and database health",
                responses: {
                    200: { description: "Application and database are healthy" },
                    500: errorResponse
                }
            }
        },
        "/api/presets": {
            get: {
                tags: ["Presets"],
                summary: "Get all presets",
                responses: {
                    200: {
                        description: "List of presets",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            id: { type: "integer" },
                                            name: { type: "string" },
                                            color: { type: "string" },
                                            brightness: { type: "integer" }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    500: errorResponse
                }
            },
            post: {
                tags: ["Presets"],
                summary: "Create a preset",
                requestBody: jsonBody({
                    name: { type: "string", example: "Evening" },
                    color: { type: "string", example: "#FF8800" },
                    brightness: {
                        type: "integer",
                        minimum: 0,
                        maximum: 100,
                        example: 75
                    }
                }, ["name", "color", "brightness"]),
                responses: {
                    201: { description: "Preset created; returns its ID" },
                    400: { description: "Invalid preset data" },
                    500: errorResponse
                }
            }
        },
        "/api/presets/{id}": {
            delete: {
                tags: ["Presets"],
                summary: "Delete a preset",
                parameters: [{
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "integer", minimum: 1 }
                }],
                responses: {
                    200: { description: "Preset deleted" },
                    400: { description: "Invalid ID" },
                    404: { description: "Preset not found" },
                    500: errorResponse
                }
            }
        },
        "/api/command": {
            post: {
                tags: ["Lamp"],
                summary: "Send a lamp command",
                requestBody: jsonBody({
                    command: {
                        type: "string",
                        example: "POWER_ON",
                        description: "Lamp command, e.g. POWER_ON or POWER_OFF"
                    }
                }, ["command"]),
                responses: {
                    200: { description: "Command processed" },
                    400: { description: "Command is required" },
                    500: errorResponse
                }
            }
        },
        "/api/device-logs": {
            get: {
                tags: ["Lamp"],
                summary: "Get the latest 50 device log entries",
                responses: {
                    200: { description: "List of device logs" },
                    500: errorResponse
                }
            }
        },
        "/api/sensor": {
            get: {
                tags: ["Sensors"],
                summary: "Get the latest 20 sensor readings",
                responses: {
                    200: { description: "List of sensor readings" },
                    500: errorResponse
                }
            },
            post: {
                tags: ["Sensors"],
                summary: "Save a sensor reading",
                requestBody: jsonBody({
                    light_level_percent: {
                        type: "integer",
                        minimum: 0,
                        maximum: 100,
                        example: 45
                    }
                }, ["light_level_percent"]),
                responses: {
                    201: { description: "Reading created; returns its ID" },
                    400: { description: "Invalid light level" },
                    500: errorResponse
                }
            }
        },
        "/api/nightmode": {
            post: {
                tags: ["Lamp"],
                summary: "Configure night mode",
                requestBody: jsonBody({
                    enabled: { type: "boolean", example: true },
                    threshold: {
                        type: "number",
                        minimum: 0,
                        maximum: 100,
                        example: 30
                    }
                }),
                responses: {
                    200: { description: "Night mode settings returned" },
                    400: { description: "Invalid threshold" }
                }
            }
        }
    }
};

module.exports = openapi;
