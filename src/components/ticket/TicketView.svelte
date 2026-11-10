<script lang="ts">
  import { onMount } from 'svelte';
  import { qrcode } from 'etiket';
  import {
    buildQRPayload,
    loadTicket,
    removeTicket,
    type StoredTicket,
  } from '../../lib/ticket.js';
  import ConfirmModal from './ConfirmModal.svelte';

  const base = import.meta.env.BASE_URL;

  type Phase = 'checking' | 'view' | 'confirmRemove';

  let ticket = $state<StoredTicket | null>(null);
  let phase = $state<Phase>('checking');
  let logoSvg = $state<string | undefined>();
  let isStandalone = $state(false);
  let qrSvg = $derived(ticket ? buildQrSvg(ticket, logoSvg) : '');

  function cleanField(val: unknown): string {
    if (typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (/^(n\/?a|none|-)$/i.test(trimmed)) return '';
    return trimmed;
  }

  let designation = $derived(cleanField(ticket?.attendee.designation));
  let organisation = $derived(cleanField(ticket?.attendee.organisation));
  let roleAndOrg = $derived.by(() => {
    if (designation && organisation) return `${designation} at ${organisation}`;
    return designation || organisation || '';
  });

  onMount(async () => {
    isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    ticket = loadTicket();
    if (!ticket) {
      window.location.assign(`${base}ticket/add`);
      return;
    }
    phase = 'view';
    logoSvg = await fetch(`${base}favicon.svg`)
      .then((res) => (res.ok ? res.text() : undefined))
      .then(sanitizeLogoSvg)
      .catch(() => undefined);
  });

  function sanitizeLogoSvg(raw: string | undefined): string | undefined {
    return raw
      ?.replace(/<\?xml[^?]*\?>/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(?:width|height)="[^"]*"/g, ''));
  }

  function buildQrSvg(value: StoredTicket, logo?: string): string {
    const eye = { outerColor: '#38B44A', innerColor: '#E95420' } as const;
    return qrcode(buildQRPayload(value), {
      size: 200,
      margin: 2,
      ecLevel: 'H',
      dotType: 'classy',
      corners: { topLeft: eye, topRight: eye, bottomLeft: eye },
      logo: logo
        ? { svg: logo, size: 0.22, margin: 4 }
        : undefined,
      ariaLabel: 'Ticket QR code',
    });
  }

  function confirmRemoval() {
    removeTicket();
    window.location.assign(`${base}ticket/add`);
  }
</script>

{#if phase === 'checking'}
  <div class="u-align-text--center" role="status" aria-label="Loading ticket">
    <i class="p-icon--spinner u-animation--spin" style="font-size: 2rem;"></i>
  </div>
{:else if ticket}
  <div class="p-card--highlighted" style="max-width: 440px; margin: 0 auto;">
    <div class="p-card__inner u-align-text--center" style="padding: 1.5rem 1rem;">
      <div class="u-sv1" style="display: flex; justify-content: center; align-items: center;">
        {@html qrSvg}
      </div>

      <div style="margin-top: 1rem;">
        <h1 class="p-heading--2" style="margin-bottom: 0.35rem; font-weight: 700; word-break: break-word;">
          {ticket.attendee.name}
        </h1>

        <div style="margin-bottom: 0.5rem;">
          <span class="p-chip" style="margin: 0;">
            <span class="p-chip__value" style="font-weight: 600; text-transform: uppercase; font-size: 0.8125rem; letter-spacing: 0.05em; color: #772953;">
              {ticket.attendee.ticketName || 'Attendee Pass'}
            </span>
          </span>
        </div>

        {#if roleAndOrg}
          <p class="u-text--muted u-no-margin--bottom" style="font-size: 0.9375rem;">
            {roleAndOrg}
          </p>
        {/if}
      </div>

      {#if phase === 'view'}
        <div class="u-sv2" style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.5rem;">
          <button
            class="p-button--positive has-icon"
            type="button"
            onclick={() => window.location.assign(`${base}ticket/add`)}
            aria-label="Replace ticket"
            title="Replace ticket"
          >
            <i class="p-icon--edit is-dark"></i>
            <span>Replace</span>
          </button>
          <button
            class="p-button--negative has-icon"
            type="button"
            onclick={() => (phase = 'confirmRemove')}
            aria-label="Remove ticket"
            title="Remove ticket"
          >
            <i class="p-icon--delete is-dark"></i>
            <span>Remove</span>
          </button>
        </div>
      {/if}
    </div>
  </div>

  {#if !isStandalone}
    <div class="p-notification--information" style="max-width: 440px; margin: 1.5rem auto 0;">
      <div class="p-notification__content">
        <h2 class="p-notification__title">Quick access from your Home Screen</h2>
        <p class="p-notification__message">
          Optional: add this attendee app to your Home Screen for quicker access.
          On iPhone or iPad, tap Share, then Add to Home Screen.
          On Android, open the browser menu and choose Add to Home screen or Install app.
        </p>
      </div>
    </div>
  {/if}

  {#if phase === 'confirmRemove'}
    <ConfirmModal
      title="Remove this ticket?"
      description={`Attendee data for ${ticket.attendee.name} will be deleted from this device.`}
      dismissLabel="Cancel"
      confirmLabel="Confirm removal"
      confirmVariant="negative"
      confirmIcon="p-icon--delete is-dark"
      onDismiss={() => (phase = 'view')}
      onConfirm={confirmRemoval}
    />
  {/if}
{/if}