/** Accelerated celestial time; component state remains owned by scene-settings. */
(function () {
    'use strict';
    const PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES = 0.25;
    const PMNDRS_DAY_NIGHT_CYCLE_DAY_MS = 86400000;

    function getPmndrsDayNightCycleRuntimeClock(self) {
        const tickTime = self && typeof self._pmndrsTickTimeMs === 'number' && isFinite(self._pmndrsTickTimeMs)
            ? self._pmndrsTickTimeMs
            : null;
        if (tickTime !== null) {
            return {
                source: 'tick',
                timeMs: tickTime
            };
        }

        return {
            source: 'perf',
            timeMs: typeof performance !== 'undefined' && typeof performance.now === 'function' ? performance.now() : Date.now()
        };
    }

    function getPmndrsDayNightCycleEffectiveDate(self, baseDate, durationMinutes) {
        const baseDateMs = baseDate.getTime();
        const baseDayStartMs = Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate());
        const baseTimeOfDayMs = ((baseDateMs - baseDayStartMs) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS + PMNDRS_DAY_NIGHT_CYCLE_DAY_MS) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        const durationMs = Math.max(
            PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES * 60000,
            durationMinutes * 60000
        );
        const clock = getPmndrsDayNightCycleRuntimeClock(self);

        let state = self._pmndrsDayNightCycleState;
        if (!state ||
            state.baseDateMs !== baseDateMs ||
            state.baseDayStartMs !== baseDayStartMs ||
            state.durationMinutes !== durationMinutes ||
            state.clockSource !== clock.source) {
            state = {
                baseDateMs,
                baseDayStartMs,
                baseTimeOfDayMs,
                durationMinutes,
                clockSource: clock.source,
                startRuntimeMs: clock.timeMs,
                effectiveDate: new Date(baseDateMs),
                moonEffectiveDate: new Date(baseDateMs)
            };
            self._pmndrsDayNightCycleState = state;
            return state.effectiveDate;
        }

        const elapsedRuntimeMs = Math.max(0, clock.timeMs - state.startRuntimeMs);
        const simulatedElapsedMs = (elapsedRuntimeMs / durationMs) * PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        const wrappedTimeOfDayMs = ((state.baseTimeOfDayMs + simulatedElapsedMs) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS + PMNDRS_DAY_NIGHT_CYCLE_DAY_MS) % PMNDRS_DAY_NIGHT_CYCLE_DAY_MS;
        // Keep the authored solar/atmosphere day stable while the Moon alone
        // accumulates its real sidereal drift across accelerated cycles.
        state.effectiveDate = new Date(state.baseDayStartMs + wrappedTimeOfDayMs);
        state.moonEffectiveDate = new Date(state.baseDateMs + simulatedElapsedMs);
        return state.effectiveDate;
    }

    VRODOSMaster.CelestialClock = Object.freeze({
        minDurationMinutes: PMNDRS_DAY_NIGHT_CYCLE_MIN_MINUTES,
        effectiveDate: getPmndrsDayNightCycleEffectiveDate
    });
})();
