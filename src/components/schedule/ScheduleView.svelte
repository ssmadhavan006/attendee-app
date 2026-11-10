<script lang="ts">
  import { scheduleStore, bookmarksStore } from '../../lib/schedule.svelte.js';
  import { formatDateLabel } from '../../lib/indico.js';
  import { EVENT_CONFIG } from '../../config.js';
  import ScheduleDay from './ScheduleDay.svelte';

  const indicoTimetableUrl = `${EVENT_CONFIG.indicoBaseUrl}/event/${EVENT_CONFIG.indicoId}/timetable/`;

  $effect(() => {
    scheduleStore.load();
    bookmarksStore.init();
  });

  let activeDay = $state<string | null>(null);
  let filterBookmarksOnly = $state(false);

  $effect(() => {
    if (
      scheduleStore.status === 'success' &&
      scheduleStore.sessionsByDay.size > 0 &&
      activeDay === null
    ) {
      activeDay = [...scheduleStore.sessionsByDay.keys()][0];
    }
  });

  const dayKeys = $derived([...scheduleStore.sessionsByDay.keys()]);
  const currentDaySessions = $derived(
    activeDay ? (scheduleStore.sessionsByDay.get(activeDay) ?? []) : []
  );
  const displayedSessions = $derived(
    filterBookmarksOnly
      ? currentDaySessions.filter((s) => bookmarksStore.has(s.id))
      : currentDaySessions
  );
  const bookmarkedCount = $derived(
    currentDaySessions.filter((s) => bookmarksStore.has(s.id)).length
  );

  function handleTabKeydown(event: KeyboardEvent, day: string): void {
    const idx = dayKeys.indexOf(day);
    let targetDay: string | null = null;
    if (event.key === 'ArrowRight' && idx < dayKeys.length - 1) {
      targetDay = dayKeys[idx + 1];
    } else if (event.key === 'ArrowLeft' && idx > 0) {
      targetDay = dayKeys[idx - 1];
    } else if (event.key === 'Home') {
      targetDay = dayKeys[0];
    } else if (event.key === 'End') {
      targetDay = dayKeys[dayKeys.length - 1];
    }
    if (targetDay) {
      activeDay = targetDay;
      document.getElementById(`schedule-tab-${targetDay}`)?.focus();
      event.preventDefault();
    }
  }
</script>

{#if scheduleStore.status === 'idle' || scheduleStore.status === 'loading'}
  <div role="status" aria-live="polite" aria-label="Loading schedule" class="u-align--center">
    <i class="p-icon--spinner u-animation--spin"></i>
    <p aria-hidden="true">Loading schedule…</p>
  </div>

{:else if scheduleStore.status === 'error'}
  <div class="p-notification--caution">
    <div class="p-notification__content">
      <h5 class="p-notification__title">Could not load schedule</h5>
      <p class="p-notification__message">
        {scheduleStore.errorMessage ?? 'An unexpected error occurred.'}
      </p>
      <p class="p-notification__message u-no-margin--bottom">
        You can still view the full event schedule directly on Indico:
      </p>
    </div>
  </div>
  <div class="u-sv1">
    <a
      href={indicoTimetableUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="p-button--positive"
    >
      View Timetable on Indico
    </a>
    <button
      class="p-button"
      onclick={() => scheduleStore.load()}
    >
      Retry
    </button>
  </div>

{:else if scheduleStore.status === 'success' && scheduleStore.sessionsByDay.size === 0}
  <div class="u-align--center">
    <h2 class="p-heading--4">Schedule coming soon</h2>
    <p>
      Session details for {EVENT_CONFIG.name} will be announced closer to the
      event.
    </p>
    <p>
      <a
        href={indicoTimetableUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="p-button"
      >
        Check Official Indico Timetable
      </a>
    </p>
  </div>

{:else if scheduleStore.status === 'success'}
  <nav class="p-tabs" aria-label="Conference days">
    <ul class="p-tabs__list" role="tablist">
      {#each dayKeys as day, i (day)}
        <li class="p-tabs__item" role="presentation">
          <button
            id={`schedule-tab-${day}`}
            class="p-tabs__link"
            role="tab"
            aria-selected={activeDay === day}
            aria-controls={`schedule-panel-${day}`}
            tabindex={activeDay === day ? 0 : -1}
            onclick={() => { activeDay = day; }}
            onkeydown={(e) => handleTabKeydown(e, day)}
          >
            Day {i + 1}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  {#if activeDay && scheduleStore.sessionsByDay.has(activeDay)}
    <div
      id={`schedule-panel-${activeDay}`}
      role="tabpanel"
      aria-labelledby={`schedule-tab-${activeDay}`}
    >
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0;">
        <p class="u-no-margin--bottom"><strong>{formatDateLabel(activeDay)}</strong></p>
        <div>
          <button
            type="button"
            class="p-button--base"
            style="font-size: 0.875rem; padding: 0.25rem 0.75rem; border: 1px solid {filterBookmarksOnly ? '#E95420' : '#d9d9d9'}; background: {filterBookmarksOnly ? '#E95420' : 'transparent'}; color: {filterBookmarksOnly ? '#ffffff' : 'inherit'}; border-radius: 4px; cursor: pointer;"
            onclick={() => { filterBookmarksOnly = !filterBookmarksOnly; }}
            aria-pressed={filterBookmarksOnly}
          >
            ★ My Bookmarks {bookmarkedCount > 0 ? `(${bookmarkedCount})` : ''}
          </button>
        </div>
      </div>

      {#if displayedSessions.length === 0}
        <div class="u-align--center" style="padding: 2.5rem 1rem;">
          <p class="u-text--muted">No bookmarked sessions for this day.</p>
          <p class="p-text--small">Tap the star icon on any session to bookmark it.</p>
        </div>
      {:else}
        <ScheduleDay sessions={displayedSessions} />
      {/if}
    </div>
  {/if}
{/if}
