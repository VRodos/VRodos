(function () {
    "use strict";

    const namespace = window.VRodosImmerseAssessment = window.VRodosImmerseAssessment || {};
    const normalizeLevel = namespace.normalizeLevel || function (value) {
        return String(value || "").trim().toUpperCase();
    };
    const decodeDisplayText = namespace.decodeDisplayText || function (value) {
        return String(value || "");
    };

    const STORAGE_PREFIX = "vrodos:immerse-results:";
    const MAX_PENDING_WRITES = 60;
    const MAX_NAME_LENGTH = 120;

    function getConfig() {
        const config = window.VRODOS_IMMERSE_RESULTS_CONFIG || {};
        return config && config.enabled !== false ? config : {};
    }

    function isEnabled() {
        const config = getConfig();
        return Boolean(config.restUrl && config.projectId && config.sceneId && config.token);
    }

    function storage() {
        try {
            return window.sessionStorage || null;
        } catch (error) {
            return null;
        }
    }

    function queryRequestsNewAttempt() {
        try {
            const params = new URLSearchParams(window.location && window.location.search || "");
            return params.get("vrodos_new_attempt") === "1";
        } catch (error) {
            return false;
        }
    }

    function normalizeDisplayName(value) {
        return decodeDisplayText(value || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, MAX_NAME_LENGTH);
    }

    function normalizeUuid(value) {
        return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    }

    function makeUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        const random = Math.random().toString(36).slice(2);
        return "attempt-" + Date.now().toString(36) + "-" + random;
    }

    function nowIso() {
        return new Date().toISOString();
    }

    function toInt(value) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : 0;
    }

    function currentSceneSnapshot(config) {
        return {
            sceneId: toInt(config.sceneId),
            sceneTitle: String(config.sceneTitle || ""),
            sceneSourceId: String(config.sceneSourceId || ""),
            visitedAt: nowIso()
        };
    }

    function defaultState(config) {
        return {
            attemptUuid: makeUuid(),
            displayName: "",
            cefrLevel: "",
            projectId: toInt(config.projectId),
            projectSlug: String(config.projectSlug || ""),
            lessonId: String(config.lessonId || ""),
            useCaseId: String(config.useCaseId || ""),
            sceneVisits: [],
            completedAssessmentKeys: [],
            pendingWrites: [],
            createdAt: nowIso(),
            updatedAt: nowIso()
        };
    }

    function storageKey(config) {
        return STORAGE_PREFIX + String(config.projectId || "unknown");
    }

    function loadState(config) {
        const store = storage();
        const key = storageKey(config);
        if (store && queryRequestsNewAttempt()) {
            try {
                store.removeItem(key);
            } catch (error) {
                // Ignore storage cleanup failures.
            }
        }

        if (!store) {
            return defaultState(config);
        }

        try {
            const parsed = JSON.parse(store.getItem(key) || "null");
            if (parsed && typeof parsed === "object" && normalizeUuid(parsed.attemptUuid)) {
                return Object.assign(defaultState(config), parsed, {
                    attemptUuid: normalizeUuid(parsed.attemptUuid),
                    projectId: toInt(config.projectId),
                    projectSlug: String(config.projectSlug || parsed.projectSlug || ""),
                    lessonId: String(config.lessonId || parsed.lessonId || ""),
                    useCaseId: String(config.useCaseId || parsed.useCaseId || ""),
                    sceneVisits: Array.isArray(parsed.sceneVisits) ? parsed.sceneVisits : [],
                    completedAssessmentKeys: Array.isArray(parsed.completedAssessmentKeys) ? parsed.completedAssessmentKeys : [],
                    pendingWrites: Array.isArray(parsed.pendingWrites) ? parsed.pendingWrites : []
                });
            }
        } catch (error) {
            // Start fresh if the stored runtime state is malformed.
        }

        return defaultState(config);
    }

    function trimPendingWrites(pendingWrites) {
        return pendingWrites.slice(Math.max(0, pendingWrites.length - MAX_PENDING_WRITES));
    }

    function endpointUrl(config, path) {
        const base = String(config.restUrl || "").replace(/\/+$/, "");
        const suffix = String(path || "").replace(/^\/+/, "");
        return base + "/" + suffix;
    }

    function normalizeAssessmentKey(payload) {
        const sourceId = String(payload && (payload.assessmentSourceId || payload.immerseAssessmentId || payload.sourceId) || "");
        const assetId = toInt(payload && payload.assetId);
        return sourceId || (assetId ? "asset:" + assetId : "");
    }

    function resultUuid() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return "result-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
    }

    function expectedAssessmentKeysForLevel(config, cefrLevel) {
        const expected = Array.isArray(config.expectedAssessments) ? config.expectedAssessments : [];
        return expected
            .filter((assessment) => {
                const levels = Array.isArray(assessment && assessment.levels) ? assessment.levels : [];
                return !levels.length || levels.includes(cefrLevel);
            })
            .map((assessment) => String(assessment.assessmentSourceId || (assessment.assetId ? "asset:" + assessment.assetId : "")))
            .filter(Boolean);
    }

    function buildRuntimeSnapshot(state, config) {
        return {
            attemptUuid: state.attemptUuid,
            displayName: state.displayName,
            cefrLevel: state.cefrLevel,
            projectId: toInt(config.projectId),
            projectSlug: String(config.projectSlug || ""),
            projectTitle: String(config.projectTitle || ""),
            lessonId: String(config.lessonId || ""),
            useCaseId: String(config.useCaseId || ""),
            useCaseName: String(config.useCaseName || ""),
            currentSceneId: toInt(config.sceneId),
            currentSceneTitle: String(config.sceneTitle || ""),
            sceneVisits: state.sceneVisits.slice(),
            expectedAssessments: Array.isArray(config.expectedAssessments) ? config.expectedAssessments.slice() : [],
            completedAssessmentKeys: state.completedAssessmentKeys.slice(),
            userAgent: typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : "",
            updatedAt: nowIso()
        };
    }

    function getSessionRuntime() {
        if (window.__vrodosImmerseAssessmentSessionRuntime) {
            return window.__vrodosImmerseAssessmentSessionRuntime;
        }

        const config = getConfig();
        const runtime = {
            state: loadState(config),
            flushing: false,
            bootstrapped: false
        };

        runtime.isEnabled = function () {
            return isEnabled();
        };

        runtime.save = function () {
            runtime.state.updatedAt = nowIso();
            const store = storage();
            if (!store) {
                return;
            }
            try {
                runtime.state.pendingWrites = trimPendingWrites(runtime.state.pendingWrites || []);
                store.setItem(storageKey(getConfig()), JSON.stringify(runtime.state));
            } catch (error) {
                // The scene must remain playable even if storage is unavailable.
            }
        };

        runtime.recordSceneVisit = function () {
            if (!isEnabled()) {
                return;
            }
            const cfg = getConfig();
            const sceneId = toInt(cfg.sceneId);
            const hasVisit = runtime.state.sceneVisits.some((visit) => toInt(visit && visit.sceneId) === sceneId);
            if (!hasVisit) {
                runtime.state.sceneVisits.push(currentSceneSnapshot(cfg));
                runtime.save();
            }
        };

        runtime.validateIdentity = function (displayName, cefrLevel) {
            return Boolean(normalizeDisplayName(displayName) && normalizeLevel(cefrLevel));
        };

        runtime.hasIdentity = function () {
            return runtime.validateIdentity(runtime.state.displayName, runtime.state.cefrLevel);
        };

        runtime.getIdentity = function () {
            return {
                displayName: runtime.state.displayName || "",
                cefrLevel: runtime.state.cefrLevel || ""
            };
        };

        runtime.setIdentity = function (displayName, cefrLevel) {
            const normalizedName = normalizeDisplayName(displayName);
            const normalizedLevel = normalizeLevel(cefrLevel);
            if (!normalizedName || !normalizedLevel) {
                return false;
            }
            runtime.state.displayName = normalizedName;
            runtime.state.cefrLevel = normalizedLevel;
            runtime.recordSceneVisit();
            runtime.save();
            runtime.ensureAttemptStarted();
            return true;
        };

        runtime.buildAttemptPayload = function () {
            const cfg = getConfig();
            const snapshot = buildRuntimeSnapshot(runtime.state, cfg);
            const expectedKeys = expectedAssessmentKeysForLevel(cfg, runtime.state.cefrLevel);
            return {
                token: String(cfg.token || ""),
                attempt_uuid: runtime.state.attemptUuid,
                project_id: toInt(cfg.projectId),
                scene_id: toInt(cfg.sceneId),
                display_name: runtime.state.displayName,
                cefr_level: runtime.state.cefrLevel,
                lesson_id: String(cfg.lessonId || ""),
                use_case_id: String(cfg.useCaseId || ""),
                use_case_name: String(cfg.useCaseName || ""),
                assessment_total: expectedKeys.length,
                assessment_completed: runtime.state.completedAssessmentKeys.filter((key) => expectedKeys.includes(key)).length,
                runtime: snapshot,
                attempt: snapshot
            };
        };

        runtime.enqueue = function (id, path, payload) {
            const pending = runtime.state.pendingWrites || [];
            const existingIndex = pending.findIndex((item) => item && item.id === id);
            const item = {
                id,
                path,
                payload,
                attempts: existingIndex > -1 ? toInt(pending[existingIndex].attempts) : 0,
                createdAt: existingIndex > -1 ? pending[existingIndex].createdAt : nowIso()
            };
            if (existingIndex > -1) {
                pending[existingIndex] = item;
            } else {
                pending.push(item);
            }
            runtime.state.pendingWrites = trimPendingWrites(pending);
            runtime.save();
        };

        runtime.postJson = function (path, payload) {
            const cfg = getConfig();
            if (!cfg.restUrl || typeof window.fetch !== "function") {
                return Promise.reject(new Error("Results endpoint is unavailable."));
            }
            return window.fetch(endpointUrl(cfg, path), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "omit",
                body: JSON.stringify(payload || {})
            }).then((response) => {
                if (!response || !response.ok) {
                    throw new Error("Results write failed with status " + (response && response.status || 0));
                }
                return response.json ? response.json() : {};
            });
        };

        runtime.flushPending = function () {
            if (runtime.flushing) {
                return runtime.flushPromise || Promise.resolve(false);
            }
            if (!isEnabled()) {
                return Promise.resolve(false);
            }
            runtime.flushing = true;
            const runNext = () => {
                const pending = runtime.state.pendingWrites || [];
                if (!pending.length) {
                    runtime.flushing = false;
                    runtime.flushPromise = null;
                    runtime.save();
                    return Promise.resolve(true);
                }
                const item = pending[0];
                return runtime.postJson(item.path, item.payload).then(() => {
                    runtime.state.pendingWrites = (runtime.state.pendingWrites || []).filter((entry) => entry && entry.id !== item.id);
                    runtime.save();
                    return runNext();
                }).catch(() => {
                    item.attempts = toInt(item.attempts) + 1;
                    runtime.state.pendingWrites[0] = item;
                    runtime.flushing = false;
                    runtime.flushPromise = null;
                    runtime.save();
                    return false;
                });
            };
            runtime.flushPromise = runNext();
            return runtime.flushPromise;
        };

        runtime.ensureAttemptStarted = function () {
            if (!isEnabled() || !runtime.hasIdentity()) {
                return Promise.resolve(false);
            }
            const payload = runtime.buildAttemptPayload();
            const id = "attempt-start:" + payload.attempt_uuid + ":" + payload.scene_id;
            runtime.enqueue(id, "attempts/start", payload);
            return runtime.flushPending();
        };

        runtime.maybeCompleteAttempt = function () {
            if (!isEnabled() || !runtime.hasIdentity()) {
                return false;
            }
            const cfg = getConfig();
            const expectedKeys = expectedAssessmentKeysForLevel(cfg, runtime.state.cefrLevel);
            if (!expectedKeys.length) {
                return false;
            }
            const completed = runtime.state.completedAssessmentKeys || [];
            const isComplete = expectedKeys.every((key) => completed.includes(key));
            if (!isComplete) {
                return false;
            }
            const payload = Object.assign(runtime.buildAttemptPayload(), {
                completed_at: nowIso()
            });
            runtime.enqueue("attempt-complete:" + runtime.state.attemptUuid, "attempts/complete", payload);
            runtime.flushPending();
            return true;
        };

        runtime.recordAssessmentResult = function (payload, result) {
            if (!isEnabled() || !runtime.hasIdentity() || !payload || !result) {
                return;
            }
            runtime.recordSceneVisit();
            const cfg = getConfig();
            const assessmentKey = normalizeAssessmentKey(payload);
            if (assessmentKey && !runtime.state.completedAssessmentKeys.includes(assessmentKey)) {
                runtime.state.completedAssessmentKeys.push(assessmentKey);
            }

            const rendererKey = typeof namespace.resolveAssessmentRendererKey === "function"
                ? namespace.resolveAssessmentRendererKey(payload, { ignoreSupported: true })
                : "";
            const uuid = resultUuid();
            const enrichedResult = Object.assign({}, result, {
                resultUuid: uuid,
                attemptUuid: runtime.state.attemptUuid,
                displayName: runtime.state.displayName,
                cefrLevel: runtime.state.cefrLevel,
                projectId: toInt(cfg.projectId),
                projectTitle: String(cfg.projectTitle || ""),
                sceneId: toInt(cfg.sceneId),
                sceneTitle: String(cfg.sceneTitle || ""),
                assetId: toInt(payload.assetId),
                assessmentSourceId: String(payload.assessmentSourceId || payload.immerseAssessmentId || ""),
                sceneObjectId: String(payload.sceneObjectId || payload.sourceId || ""),
                rendererKey
            });

            const postPayload = {
                token: String(cfg.token || ""),
                attempt_uuid: runtime.state.attemptUuid,
                result_uuid: uuid,
                project_id: toInt(cfg.projectId),
                scene_id: toInt(cfg.sceneId),
                asset_id: toInt(payload.assetId),
                assessment_source_id: String(payload.assessmentSourceId || payload.immerseAssessmentId || ""),
                scene_object_id: String(payload.sceneObjectId || payload.sourceId || ""),
                display_name: runtime.state.displayName,
                cefr_level: runtime.state.cefrLevel,
                renderer_key: rendererKey,
                title: String(payload.title || result.title || ""),
                type: String(payload.type || result.type || ""),
                group: String(payload.group || result.group || ""),
                is_correct: result.isCorrect === true ? true : (result.isCorrect === false ? false : null),
                score: typeof result.score === "number" ? result.score : null,
                response: result.response || {},
                result: enrichedResult,
                attempt: runtime.buildAttemptPayload().attempt
            };

            runtime.enqueue("assessment-result:" + uuid, "assessment-results", postPayload);
            runtime.save();
            if (!runtime.maybeCompleteAttempt()) {
                runtime.flushPending();
            }
        };

        runtime.bootstrap = function () {
            if (runtime.bootstrapped) {
                return;
            }
            runtime.bootstrapped = true;
            runtime.recordSceneVisit();
            if (runtime.hasIdentity()) {
                runtime.ensureAttemptStarted();
            }
            runtime.flushPending();
            if (typeof document !== "undefined" && document && typeof document.addEventListener === "function") {
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState !== "hidden") {
                        runtime.flushPending();
                    }
                });
            }
        };

        runtime.bootstrap();
        window.__vrodosImmerseAssessmentSessionRuntime = runtime;
        return runtime;
    }

    namespace.getAssessmentSessionRuntime = getSessionRuntime;
})();
