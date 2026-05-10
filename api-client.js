/**
 * API Client for AgriSurgeon
 * Handles all communication with the backend API
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

class APIClient {

    constructor(baseURL = API_BASE_URL) {

        this.baseURL = baseURL;
    }

    /**
     * =====================================================
     * HEALTH CHECK
     * =====================================================
     */

    async healthCheck() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/health`
            );

            if (!response.ok) {

                throw new Error(
                    'Health check failed'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'Health check error:',
                error
            );

            return null;
        }
    }

    /**
     * =====================================================
     * PREDICT DISEASE
     * =====================================================
     */

    async predictDisease(formData) {

        try {

            // =============================================
            // DEBUG LOGS
            // =============================================

            console.log(
                '================================'
            );

            console.log(
                'Sending prediction request...'
            );

            console.log(
                '================================'
            );

            for (let pair of formData.entries()) {

                console.log(
                    pair[0],
                    pair[1]
                );
            }

            // =============================================
            // API REQUEST
            // =============================================

            const response = await fetch(
                `${this.baseURL}/api/predict`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            // =============================================
            // PARSE RESPONSE
            // =============================================

            const data = await response.json();

            console.log(
                'Backend Response:',
                data
            );

            // =============================================
            // HANDLE ERRORS
            // =============================================

            if (!response.ok) {

                let errorMessage =
                    'Prediction failed';

                // FASTAPI VALIDATION ERRORS

                if (data.detail) {

                    if (
                        Array.isArray(data.detail)
                    ) {

                        errorMessage =
                            data.detail
                                .map(
                                    err =>
                                        `${err.loc?.join(' -> ')} : ${err.msg}`
                                )
                                .join('\n');

                    } else {

                        errorMessage =
                            data.detail;
                    }
                }

                // CUSTOM BACKEND ERRORS

                else if (data.error) {

                    errorMessage =
                        data.error;
                }

                throw new Error(
                    errorMessage
                );
            }

            return data;

        } catch (error) {

            console.error(
                'Prediction error:',
                error
            );

            throw error;
        }
    }

    /**
     * =====================================================
     * BATCH PREDICT
     * =====================================================
     */

    async batchPredict(formData) {

        try {

            const response = await fetch(
                `${this.baseURL}/api/batch-predict`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.error ||
                    'Batch prediction failed'
                );
            }

            return data;

        } catch (error) {

            console.error(
                'Batch prediction error:',
                error
            );

            throw error;
        }
    }

    /**
     * =====================================================
     * GET DISEASES
     * =====================================================
     */

    async getDiseases() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/diseases`
            );

            if (!response.ok) {

                throw new Error(
                    'Failed to fetch diseases'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'Get diseases error:',
                error
            );

            return null;
        }
    }

    /**
     * =====================================================
     * GET MODELS
     * =====================================================
     */

    async getModels() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/models`
            );

            if (!response.ok) {

                throw new Error(
                    'Failed to fetch models'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'Get models error:',
                error
            );

            return null;
        }
    }

    /**
     * =====================================================
     * GET STATISTICS
     * =====================================================
     */

    async getStatistics() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/statistics`
            );

            if (!response.ok) {

                throw new Error(
                    'Failed to fetch statistics'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'Get statistics error:',
                error
            );

            return null;
        }
    }

    /**
     * =====================================================
     * GET HISTORY
     * =====================================================
     */

    async getHistory() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/history`
            );

            if (!response.ok) {

                throw new Error(
                    'Failed to fetch history'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'History error:',
                error
            );

            return null;
        }
    }

    /**
     * =====================================================
     * CLEAR HISTORY
     * =====================================================
     */

    async clearHistory() {

        try {

            const response = await fetch(
                `${this.baseURL}/api/history`,
                {
                    method: 'DELETE'
                }
            );

            if (!response.ok) {

                throw new Error(
                    'Failed to clear history'
                );
            }

            return await response.json();

        } catch (error) {

            console.error(
                'Clear history error:',
                error
            );

            return null;
        }
    }
}

/**
 * =========================================================
 * GLOBAL INSTANCE
 * =========================================================
 */

window.apiClient = new APIClient();