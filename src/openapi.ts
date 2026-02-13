export const openApiSpec = {
    "openapi": "3.0.0",
    "info": {
        "title": "TVTS API",
        "description": "API for fetching TradingView data (Price, Quote, History).",
        "version": "1.0.0"
    },
    "servers": [
        {
            "url": "https://tvts.vercel.app",
            "description": "Production Server"
        },
        {
            "url": "http://localhost:7070",
            "description": "Local Development Server"
        }
    ],
    "paths": {
        "/api/price/{symbol}": {
            "get": {
                "summary": "Get current price",
                "parameters": [
                    {
                        "name": "symbol",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "example": "COINBASE:BTCUSD"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/PriceResponse"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/quote/{symbol}": {
            "get": {
                "summary": "Get current quote",
                "parameters": [
                    {
                        "name": "symbol",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "example": "IDX:BBCA"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/Quote"
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/history/{symbol}": {
            "get": {
                "summary": "Get historical OHLCV data",
                "parameters": [
                    {
                        "name": "symbol",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "example": "COINBASE:ETHUSD"
                        }
                    },
                    {
                        "name": "interval",
                        "in": "query",
                        "schema": {
                            "type": "string",
                            "default": "15",
                            "enum": ["1", "5", "15", "30", "60", "240", "1D", "1W", "1M"]
                        }
                    },
                    {
                        "name": "bars",
                        "in": "query",
                        "schema": {
                            "type": "integer",
                            "default": 100
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Successful response",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": "#/components/schemas/OHLCV"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "schemas": {
            "PriceResponse": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string"
                    },
                    "price": {
                        "type": "number"
                    }
                }
            },
            "Quote": {
                "type": "object",
                "properties": {
                    "symbol": {
                        "type": "string"
                    },
                    "price": {
                        "type": "number"
                    },
                    "bid": {
                        "type": "number"
                    },
                    "ask": {
                        "type": "number"
                    },
                    "volume": {
                        "type": "number"
                    },
                    "timestamp": {
                        "type": "string",
                        "format": "date-time"
                    }
                }
            },
            "OHLCV": {
                "type": "object",
                "properties": {
                    "timestamp": {
                        "type": "string",
                        "format": "date-time"
                    },
                    "open": {
                        "type": "number"
                    },
                    "high": {
                        "type": "number"
                    },
                    "low": {
                        "type": "number"
                    },
                    "close": {
                        "type": "number"
                    },
                    "volume": {
                        "type": "number"
                    }
                }
            }
        }
    }
};
