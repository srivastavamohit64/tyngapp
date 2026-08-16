import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Database,
  DataSnapshot,
  get,
  getDatabase,
  off,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from 'firebase/database';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { resolveMediaUrl } from '../utils/media-url.util';

export interface ChatThread {
  id: string;
  chatId: string;
  type: 'game' | 'private' | string;
  chatType: string;
  bookingId?: string | null;
  gameId?: string | null;
  title: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderName?: string | null;
  unreadCount: number;
  pinned?: boolean;
  pinnedAt?: string | null;
  peer?: { id: string; name: string; avatar?: string | null } | null;
  memberIds?: string[];
}

export interface ChatMessage {
  id: string;
  messageId?: string;
  chatId: string;
  text: string;
  senderId: string;
  senderName?: string | null;
  senderAvatar?: string | null;
  createdAt?: string | null;
  isSelf?: boolean;
}

export interface ChatPeer {
  id: string | number;
  name: string;
  avatar?: string | null;
}

export interface ChatTypingUser {
  id: string;
  name: string;
  atMs: number;
}

export interface OpenGameChatOptions {
  title?: string;
  avatar?: string | null;
  memberIds?: Array<string | number>;
}

interface RtdbMessage {
  id?: string;
  text?: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string | null;
  createdAt?: string;
  createdAtMs?: number;
}

interface RtdbInboxRow {
  id?: string;
  chatId?: string;
  type?: string;
  chatType?: string;
  bookingId?: string | null;
  gameId?: string | null;
  title?: string;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  lastSenderName?: string | null;
  unreadCount?: number;
  pinned?: boolean;
  pinnedAt?: string | null;
  pinnedAtMs?: number;
  peer?: { id?: string; name?: string; avatar?: string | null } | null;
  memberIds?: string[];
  updatedAtMs?: number;
}

interface RtdbMeta {
  type?: string;
  bookingId?: string | number | null;
  memberIds?: Array<string | number>;
  title?: string | null;
  avatar?: string | null;
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  updatedAt?: string | null;
}

/**
 * All chat traffic uses Firebase Realtime Database directly:
 * - Inbox:    userChats/{userId}/{chatId}
 * - Meta:     chats/{chatId}/meta
 * - Messages: chats/{chatId}/messages/{messageId}
 * - Typing:   chats/{chatId}/typing/{userId}
 */
@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly zone = inject(NgZone);

  private db: Database | null = null;
  private messagesRef: ReturnType<typeof ref> | null = null;
  private inboxRef: ReturnType<typeof ref> | null = null;
  private badgeRef: ReturnType<typeof ref> | null = null;
  private typingRef: ReturnType<typeof ref> | null = null;
  private typingStaleTimer: ReturnType<typeof setInterval> | null = null;

  static privateChatId(userA: string | number, userB: string | number): string {
    const a = Number(userA);
    const b = Number(userB);
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return `private_${min}_${max}`;
  }

  static gameChatId(bookingId: string | number): string {
    return `game_${bookingId}`;
  }

  async openPrivate(peer: ChatPeer | string | number): Promise<ApiResponse<ChatThread>> {
    try {
      const me = this.requireUser();
      const peerId = typeof peer === 'object' ? String(peer.id) : String(peer);
      const peerName = typeof peer === 'object' ? peer.name || 'Player' : 'Player';
      const peerAvatar = typeof peer === 'object' ? peer.avatar ?? null : null;

      if (!peerId || peerId === String(me.id)) {
        return this.fail('Invalid chat peer.');
      }

      const chatId = ChatService.privateChatId(me.id, peerId);
      const memberIds = [String(me.id), peerId].sort((a, b) => Number(a) - Number(b));
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();

      await this.ensureDb();
      if (!this.db) return this.fail('Firebase is unavailable.');

      const metaSnap = await get(ref(this.db, `chats/${this.safeKey(chatId)}/meta`));
      const existing = (metaSnap.val() || {}) as RtdbMeta;
      const title = existing.title || peerName;

      const updates: Record<string, unknown> = {
        [`chats/${this.safeKey(chatId)}/meta`]: {
          type: 'private',
          bookingId: null,
          memberIds,
          title,
          avatar: existing.avatar ?? null,
          lastMessage: existing.lastMessage ?? null,
          lastMessageAt: existing.lastMessageAt ?? null,
          updatedAt: existing.updatedAt || nowIso,
        },
        [`userChats/${me.id}/${this.safeKey(chatId)}`]: await this.buildInboxPatch(
          chatId,
          'private',
          {
            title: peerName,
            avatar: resolveMediaUrl(peerAvatar),
            peer: { id: peerId, name: peerName, avatar: resolveMediaUrl(peerAvatar) },
            memberIds,
            existingUnread: undefined,
            lastMessage: existing.lastMessage ?? null,
            lastMessageAt: existing.lastMessageAt ?? null,
            updatedAtMs: Number(existing.lastMessageAt ? Date.parse(String(existing.lastMessageAt)) : nowMs),
          },
          me.id,
        ),
        [`userChats/${peerId}/${this.safeKey(chatId)}`]: await this.buildInboxPatch(
          chatId,
          'private',
          {
            title: me.name || 'Player',
            avatar: resolveMediaUrl(me.profileImage),
            peer: {
              id: String(me.id),
              name: me.name || 'Player',
              avatar: resolveMediaUrl(me.profileImage),
            },
            memberIds,
            existingUnread: undefined,
            lastMessage: existing.lastMessage ?? null,
            lastMessageAt: existing.lastMessageAt ?? null,
            updatedAtMs: Number(existing.lastMessageAt ? Date.parse(String(existing.lastMessageAt)) : nowMs),
          },
          peerId,
        ),
      };

      await update(ref(this.db), updates);

      const thread = await this.readThread(chatId);
      return this.ok(thread!, 'Private chat ready.');
    } catch (error: any) {
      const msg = String(error?.message || '');
      if (/permission_denied|permission denied/i.test(msg)) {
        return this.fail(
          'Firebase permission denied. Allow read/write on chats and userChats in Realtime Database rules.',
        );
      }
      return this.fail(error?.message || 'Unable to open private chat.');
    }
  }

  async openGame(
    bookingId: string | number,
    options: OpenGameChatOptions = {},
  ): Promise<ApiResponse<ChatThread>> {
    try {
      const me = this.requireUser();
      const chatId = ChatService.gameChatId(bookingId);
      const memberIds = Array.from(
        new Set(
          (options.memberIds?.length ? options.memberIds : [me.id]).map((id) => String(id)),
        ),
      );
      if (!memberIds.includes(String(me.id))) {
        memberIds.push(String(me.id));
      }

      const title = options.title || `Game #${bookingId}`;
      const avatar = options.avatar ?? null;
      const nowIso = new Date().toISOString();
      const nowMs = Date.now();

      await this.ensureDb();
      if (!this.db) return this.fail('Firebase is unavailable.');

      const metaSnap = await get(ref(this.db, `chats/${this.safeKey(chatId)}/meta`));
      const existing = (metaSnap.val() || {}) as RtdbMeta;
      const mergedMembers = Array.from(
        new Set([...(existing.memberIds || []).map(String), ...memberIds]),
      );

      const updates: Record<string, unknown> = {
        [`chats/${this.safeKey(chatId)}/meta`]: {
          type: 'game',
          bookingId: String(bookingId),
          memberIds: mergedMembers,
          title: existing.title || title,
          avatar: existing.avatar ?? avatar,
          lastMessage: existing.lastMessage ?? null,
          lastMessageAt: existing.lastMessageAt ?? null,
          updatedAt: existing.updatedAt || nowIso,
        },
      };

      for (const memberId of mergedMembers) {
        updates[`userChats/${memberId}/${this.safeKey(chatId)}`] = await this.buildInboxPatch(
          chatId,
          'game',
          {
            title: existing.title || title,
            avatar: existing.avatar ?? avatar,
            peer: null,
            memberIds: mergedMembers,
            bookingId: String(bookingId),
            existingUnread: undefined,
            lastMessage: existing.lastMessage ?? null,
            lastMessageAt: existing.lastMessageAt ?? null,
            updatedAtMs: Number(existing.lastMessageAt ? Date.parse(String(existing.lastMessageAt)) : nowMs),
          },
          memberId,
        );
      }

      await update(ref(this.db), updates);

      try {
        await firstValueFrom(this.api.post<ChatThread>(`/chats/game/${encodeURIComponent(String(bookingId))}`, {}));
      } catch {
        // Firebase inbox is the live source; MySQL membership is best-effort.
      }

      const thread = await this.readThread(chatId);
      return this.ok(thread!, 'Game chat ready.');
    } catch (error: any) {
      return this.fail(error?.message || 'Unable to open game chat.');
    }
  }

  async getThread(chatId: string): Promise<ApiResponse<ChatThread>> {
    try {
      const thread = await this.readThread(chatId);
      if (!thread) {
        return this.fail('Chat not found.');
      }
      return this.ok(thread, 'Chat fetched successfully.');
    } catch (error: any) {
      return this.fail(error?.message || 'Unable to load chat.');
    }
  }

  async sendMessage(chatId: string, text: string): Promise<ApiResponse<ChatMessage>> {
    try {
      const me = this.requireUser();
      const trimmed = String(text || '').trim();
      if (!trimmed) {
        return this.fail('Message text is required.');
      }

      await this.ensureDb();
      if (!this.db) return this.fail('Firebase is unavailable.');

      const safeId = this.safeKey(chatId);
      const metaSnap = await get(ref(this.db, `chats/${safeId}/meta`));
      const meta = (metaSnap.val() || {}) as RtdbMeta;
      let memberIds = (meta.memberIds || []).map(String);
      if (!memberIds.length) {
        memberIds = this.memberIdsFromChatId(chatId, String(me.id));
      }
      if (!memberIds.includes(String(me.id))) {
        memberIds.push(String(me.id));
      }

      const msgRef = push(ref(this.db, `chats/${safeId}/messages`));
      const messageId = msgRef.key || `msg_${Date.now()}`;
      const now = new Date();
      const nowIso = now.toISOString();
      const nowMs = now.getTime();
      const type = String(meta.type || (chatId.startsWith('game_') ? 'game' : 'private'));
      const title = String(meta.title || (type === 'game' ? 'Game Chat' : 'Chat'));

      const message: ChatMessage = {
        id: messageId,
        messageId,
        chatId,
        text: trimmed,
        senderId: String(me.id),
        senderName: me.name || 'Player',
        senderAvatar: resolveMediaUrl(me.profileImage),
        createdAt: nowIso,
        isSelf: true,
      };

      const updates: Record<string, unknown> = {
        [`chats/${safeId}/messages/${messageId}`]: {
          id: messageId,
          text: trimmed,
          senderId: String(me.id),
          senderName: me.name || 'Player',
          senderAvatar: resolveMediaUrl(me.profileImage),
          createdAt: nowIso,
          createdAtMs: nowMs,
        },
        [`chats/${safeId}/meta`]: {
          type,
          bookingId: meta.bookingId ?? (type === 'game' ? chatId.replace(/^game_/, '') : null),
          memberIds,
          title,
          avatar: meta.avatar ?? null,
          lastMessage: trimmed,
          lastMessageAt: nowIso,
          updatedAt: nowIso,
        },
      };

      for (const memberId of memberIds) {
        const inboxSnap = await get(ref(this.db, `userChats/${memberId}/${safeId}`));
        const existing = (inboxSnap.val() || {}) as RtdbInboxRow;
        const isSelf = memberId === String(me.id);
        const unread = isSelf ? 0 : Number(existing.unreadCount || 0) + 1;

        let peer = existing.peer
          ? {
              id: String(existing.peer.id || ''),
              name: String(existing.peer.name || ''),
              avatar: existing.peer.avatar != null ? String(existing.peer.avatar) : null,
            }
          : null;

        if (type === 'private' && !peer) {
          const otherId = memberIds.find((id) => id !== memberId) || '';
          if (isSelf) {
            // Prefer existing inbox title; peer filled when chat was opened.
            peer = otherId
              ? { id: otherId, name: String(existing.title || 'Player'), avatar: existing.avatar ?? null }
              : null;
          } else {
            peer = {
              id: String(me.id),
              name: me.name || 'Player',
              avatar: me.profileImage ?? null,
            };
          }
        }

        updates[`userChats/${memberId}/${safeId}`] = {
          id: chatId,
          chatId,
          type,
          chatType: type,
          bookingId: type === 'game' ? String(meta.bookingId || chatId.replace(/^game_/, '')) : null,
          gameId: type === 'game' ? String(meta.bookingId || chatId.replace(/^game_/, '')) : null,
          title: type === 'private' ? peer?.name || existing.title || title : existing.title || title,
          avatar: type === 'private' ? peer?.avatar ?? existing.avatar ?? null : existing.avatar ?? meta.avatar ?? null,
          lastMessage: trimmed,
          lastMessageAt: nowIso,
          lastSenderName: isSelf ? 'You' : me.name || 'Player',
          unreadCount: unread,
          pinned: !!existing.pinned,
          pinnedAt: existing.pinnedAt ?? null,
          pinnedAtMs: Number(existing.pinnedAtMs || 0),
          peer,
          memberIds,
          updatedAtMs: nowMs,
        };
      }

      updates[`chats/${safeId}/typing/${me.id}`] = null;
      await update(ref(this.db), updates);
      return this.ok(message, 'Message sent.');
    } catch (error: any) {
      return this.fail(error?.message || 'Unable to send message.');
    }
  }

  async markRead(chatId: string): Promise<ApiResponse<{ chat: number }>> {
    try {
      const me = this.requireUser();
      await this.ensureDb();
      if (!this.db) return this.fail('Firebase is unavailable.');

      const safeId = this.safeKey(chatId);
      const path = `userChats/${me.id}/${safeId}`;
      const snap = await get(ref(this.db, path));
      if (snap.exists()) {
        await update(ref(this.db, path), { unreadCount: 0 });
      }

      const total = await this.totalUnread(String(me.id));
      return this.ok({ chat: total }, 'Chat marked as read.');
    } catch (error: any) {
      return this.fail(error?.message || 'Unable to mark chat read.');
    }
  }

  async setPinned(chatId: string, pinned: boolean): Promise<ApiResponse<ChatThread>> {
    try {
      const me = this.requireUser();
      await this.ensureDb();
      if (!this.db) return this.fail('Firebase is unavailable.');

      const safeId = this.safeKey(chatId);
      const path = `userChats/${me.id}/${safeId}`;
      const snap = await get(ref(this.db, path));
      if (!snap.exists()) {
        return this.fail('Chat not found.');
      }

      const nowIso = new Date().toISOString();
      await update(ref(this.db, path), {
        pinned,
        pinnedAt: pinned ? nowIso : null,
        pinnedAtMs: pinned ? Date.now() : 0,
      });

      try {
        await firstValueFrom(this.api.post<ChatThread>(`/chats/${encodeURIComponent(chatId)}/pin`, { pinned }));
      } catch {
        // Firebase is the live source; Laravel pin is best-effort for DB sync.
      }

      const thread = await this.readThread(chatId);
      return this.ok(thread!, pinned ? 'Chat pinned.' : 'Chat unpinned.');
    } catch (error: any) {
      return this.fail(error?.message || 'Unable to update pin.');
    }
  }

  async totalUnread(userId?: string): Promise<number> {
    const uid = userId || String(this.auth.user()?.id || '');
    if (!uid) return 0;
    await this.ensureDb();
    if (!this.db) return 0;
    const snap = await get(ref(this.db, `userChats/${uid}`));
    const val = snap.val() as Record<string, RtdbInboxRow> | null;
    if (!val) return 0;
    return Object.values(val).reduce((sum, row) => sum + Number(row?.unreadCount || 0), 0);
  }

  /**
   * Live inbox from RTDB userChats/{userId}.
   */
  async listenThreads(onThreads: (threads: ChatThread[]) => void): Promise<() => void> {
    this.stopInboxListening();

    const userId = String(this.auth.user()?.id || '');
    if (!userId) {
      onThreads([]);
      return () => undefined;
    }

    try {
      await this.ensureDb();
      if (!this.db) {
        return () => undefined;
      }

      this.inboxRef = ref(this.db, `userChats/${userId}`);
      let listenGen = 0;
      onValue(
        this.inboxRef,
        (snap: DataSnapshot) => {
          const threads = this.snapshotToThreads(snap);
          const gen = ++listenGen;
          this.zone.run(() => onThreads(threads));
          void this.fillMissingPreviews(userId, threads).then((filled) => {
            if (gen !== listenGen) return;
            if (filled === threads) return;
            this.zone.run(() => onThreads(filled));
          });
        },
        (error) => {
          console.warn('[TYNG Chat] RTDB inbox listen failed', error);
        },
      );
    } catch (error) {
      console.warn('[TYNG Chat] RTDB inbox unavailable', error);
    }

    return () => this.stopInboxListening();
  }

  /** Live unread total for tab badge. */
  async listenUnreadTotal(onTotal: (total: number) => void): Promise<() => void> {
    this.stopBadgeListening();
    const userId = String(this.auth.user()?.id || '');
    if (!userId) {
      onTotal(0);
      return () => undefined;
    }

    try {
      await this.ensureDb();
      if (!this.db) return () => undefined;

      this.badgeRef = ref(this.db, `userChats/${userId}`);
      onValue(
        this.badgeRef,
        (snap) => {
          const threads = this.snapshotToThreads(snap);
          const total = threads.reduce((sum, t) => sum + Number(t.unreadCount || 0), 0);
          this.zone.run(() => onTotal(total));
        },
        (error) => console.warn('[TYNG Chat] RTDB badge listen failed', error),
      );
    } catch (error) {
      console.warn('[TYNG Chat] RTDB badge unavailable', error);
    }

    return () => this.stopBadgeListening();
  }

  async listenMessages(
    chatId: string,
    currentUserId: string,
    onMessages: (messages: ChatMessage[]) => void,
  ): Promise<() => void> {
    this.stopMessageListening();

    try {
      await this.ensureDb();
      if (!this.db) {
        return () => undefined;
      }

      const safeId = this.safeKey(chatId);
      this.messagesRef = ref(this.db, `chats/${safeId}/messages`);

      onValue(
        this.messagesRef,
        (snap: DataSnapshot) => {
          const messages = this.snapshotToMessages(snap, chatId, currentUserId);
          this.zone.run(() => onMessages(messages));
        },
        (error) => {
          console.warn('[TYNG Chat] RTDB messages listen failed', error);
        },
      );
    } catch (error) {
      console.warn('[TYNG Chat] RTDB messages unavailable', error);
    }

    return () => this.stopMessageListening();
  }

  async setTyping(chatId: string, isTyping: boolean): Promise<void> {
    try {
      const me = this.requireUser();
      await this.ensureDb();
      if (!this.db || !chatId) return;

      const path = ref(this.db, `chats/${this.safeKey(chatId)}/typing/${me.id}`);
      if (!isTyping) {
        await remove(path);
        return;
      }

      await set(path, {
        name: me.name || 'Player',
        atMs: Date.now(),
      });
      void onDisconnect(path).remove();
    } catch (error) {
      console.warn('[TYNG Chat] typing update failed', error);
    }
  }

  async listenTyping(
    chatId: string,
    currentUserId: string,
    onTyping: (people: ChatTypingUser[]) => void,
  ): Promise<() => void> {
    this.stopTypingListening();

    try {
      await this.ensureDb();
      if (!this.db) {
        return () => undefined;
      }

      const ttlMs = 4500;
      this.typingRef = ref(this.db, `chats/${this.safeKey(chatId)}/typing`);
      let latest: Record<string, { name?: string; atMs?: number }> | null = null;

      const emit = () => {
        const cutoff = Date.now() - ttlMs;
        const people = Object.entries(latest || {})
          .map(([id, row]) => ({
            id: String(id),
            name: String(row?.name || 'Player'),
            atMs: Number(row?.atMs || 0),
          }))
          .filter((row) => row.id !== String(currentUserId) && row.atMs >= cutoff);
        this.zone.run(() => onTyping(people));
      };

      onValue(
        this.typingRef,
        (snap: DataSnapshot) => {
          latest = (snap.val() || null) as Record<string, { name?: string; atMs?: number }> | null;
          emit();
        },
        (error) => {
          console.warn('[TYNG Chat] RTDB typing listen failed', error);
        },
      );

      this.typingStaleTimer = setInterval(emit, 1000);
    } catch (error) {
      console.warn('[TYNG Chat] RTDB typing unavailable', error);
    }

    return () => this.stopTypingListening();
  }

  async fetchMessagesOnce(chatId: string, currentUserId: string): Promise<ChatMessage[]> {
    await this.ensureDb();
    if (!this.db) return [];
    const snap = await get(ref(this.db, `chats/${this.safeKey(chatId)}/messages`));
    return this.snapshotToMessages(snap, chatId, currentUserId);
  }

  stopListening(): void {
    this.stopMessageListening();
    this.stopInboxListening();
    this.stopBadgeListening();
    this.stopTypingListening();
  }

  stopMessageListening(): void {
    if (this.messagesRef) {
      off(this.messagesRef);
      this.messagesRef = null;
    }
  }

  stopInboxListening(): void {
    if (this.inboxRef) {
      off(this.inboxRef);
      this.inboxRef = null;
    }
  }

  stopBadgeListening(): void {
    if (this.badgeRef) {
      off(this.badgeRef);
      this.badgeRef = null;
    }
  }

  stopTypingListening(): void {
    if (this.typingStaleTimer) {
      clearInterval(this.typingStaleTimer);
      this.typingStaleTimer = null;
    }
    if (this.typingRef) {
      off(this.typingRef);
      this.typingRef = null;
    }
  }

  ngOnDestroy(): void {
    this.stopListening();
  }

  private async readThread(chatId: string): Promise<ChatThread | null> {
    const me = this.requireUser();
    await this.ensureDb();
    if (!this.db) return null;

    const safeId = this.safeKey(chatId);
    const inboxSnap = await get(ref(this.db, `userChats/${me.id}/${safeId}`));
    if (inboxSnap.exists()) {
      return this.rowToThread(safeId, inboxSnap.val() as RtdbInboxRow);
    }

    const metaSnap = await get(ref(this.db, `chats/${safeId}/meta`));
    if (!metaSnap.exists()) {
      // Minimal local view for deep links (openPrivate/openGame should run first).
      if (chatId.startsWith('private_') || chatId.startsWith('game_')) {
        const type = chatId.startsWith('game_') ? 'game' : 'private';
        return {
          id: chatId,
          chatId,
          type,
          chatType: type,
          bookingId: type === 'game' ? chatId.replace(/^game_/, '') : null,
          gameId: type === 'game' ? chatId.replace(/^game_/, '') : null,
          title: type === 'game' ? 'Game Chat' : 'Chat',
          avatar: null,
          lastMessage: null,
          lastMessageAt: null,
          unreadCount: 0,
          pinned: false,
          peer: null,
        };
      }
      return null;
    }

    const meta = metaSnap.val() as RtdbMeta;
    const type = String(meta.type || (chatId.startsWith('game_') ? 'game' : 'private'));
    return {
      id: chatId,
      chatId,
      type,
      chatType: type,
      bookingId: meta.bookingId != null ? String(meta.bookingId) : null,
      gameId: meta.bookingId != null ? String(meta.bookingId) : null,
      title: String(meta.title || (type === 'game' ? 'Game Chat' : 'Chat')),
      avatar: resolveMediaUrl(meta.avatar != null ? String(meta.avatar) : null),
          lastMessage: meta.lastMessage != null ? String(meta.lastMessage) : null,
          lastMessageAt: meta.lastMessageAt != null ? String(meta.lastMessageAt) : null,
          lastSenderName: null,
          unreadCount: 0,
          pinned: false,
          pinnedAt: null,
          peer: null,
          memberIds: (meta.memberIds || []).map(String),
        };
  }

  private rowToThread(key: string, row: RtdbInboxRow): ChatThread {
    const type = String(row?.type || row?.chatType || 'private');
    const id = String(row?.id || row?.chatId || key);
    const peer = row?.peer
      ? {
          id: String(row.peer.id || ''),
          name: String(row.peer.name || ''),
          avatar: row.peer.avatar != null ? resolveMediaUrl(String(row.peer.avatar)) : null,
        }
      : null;
    return {
      id,
      chatId: id,
      type,
      chatType: type,
      bookingId: row?.bookingId != null ? String(row.bookingId) : null,
      gameId: row?.gameId != null ? String(row.gameId) : null,
      title: String(row?.title || peer?.name || (type === 'game' ? 'Game Chat' : 'Chat')),
      avatar: resolveMediaUrl(row?.avatar != null ? String(row.avatar) : peer?.avatar || null),
      lastMessage: row?.lastMessage != null ? String(row.lastMessage) : null,
      lastMessageAt: row?.lastMessageAt != null ? String(row.lastMessageAt) : null,
      lastSenderName: row?.lastSenderName != null ? String(row.lastSenderName) : null,
      unreadCount: Number(row?.unreadCount || 0),
      pinned: !!row?.pinned,
      pinnedAt: row?.pinnedAt != null ? String(row.pinnedAt) : null,
      peer,
      memberIds: (row?.memberIds || []).map(String),
    };
  }

  private async buildInboxPatch(
    chatId: string,
    type: string,
    opts: {
      title: string;
      avatar?: string | null;
      peer: ChatThread['peer'];
      memberIds: string[];
      bookingId?: string | null;
      existingUnread?: number;
      lastMessage?: string | null;
      lastMessageAt?: string | null;
      updatedAtMs: number;
    },
    forUserId: string,
  ): Promise<RtdbInboxRow> {
    await this.ensureDb();
    let existing: RtdbInboxRow | null = null;
    if (this.db) {
      const snap = await get(ref(this.db, `userChats/${forUserId}/${this.safeKey(chatId)}`));
      existing = (snap.val() || null) as RtdbInboxRow | null;
    }
    const unread = opts.existingUnread !== undefined
      ? opts.existingUnread
      : Number(existing?.unreadCount || 0);

    return {
      id: chatId,
      chatId,
      type,
      chatType: type,
      bookingId: opts.bookingId ?? null,
      gameId: opts.bookingId ?? null,
      title: opts.title,
      avatar: opts.avatar ?? null,
      lastMessage: opts.lastMessage ?? existing?.lastMessage ?? null,
      lastMessageAt: opts.lastMessageAt ?? existing?.lastMessageAt ?? null,
      lastSenderName: existing?.lastSenderName ?? null,
      unreadCount: Number(unread || 0),
      pinned: !!existing?.pinned,
      pinnedAt: existing?.pinnedAt ?? null,
      pinnedAtMs: Number(existing?.pinnedAtMs || 0),
      peer: opts.peer,
      memberIds: opts.memberIds,
      updatedAtMs: opts.updatedAtMs,
    };
  }

  private memberIdsFromChatId(chatId: string, fallbackUserId: string): string[] {
    const privateMatch = /^private_(\d+)_(\d+)$/.exec(chatId);
    if (privateMatch) {
      return [privateMatch[1], privateMatch[2]];
    }
    return [fallbackUserId];
  }

  private requireUser() {
    const user = this.auth.user();
    if (!user?.id) {
      throw new Error('You must be signed in to use chat.');
    }
    return user;
  }

  private ok<T>(data: T, message: string): ApiResponse<T> {
    return { success: true, message, data, errors: null };
  }

  private fail(message: string): ApiResponse<any> {
    return { success: false, message, data: null, errors: null };
  }

  private async ensureDb(): Promise<void> {
    if (this.db) return;
    const app = this.ensureApp();
    this.db = getDatabase(app);
  }

  private ensureApp(): FirebaseApp {
    if (getApps().length) {
      return getApp();
    }

    const fb = environment.firebase || ({} as typeof environment.firebase);
    return initializeApp({
      apiKey: fb.apiKey,
      authDomain: fb.authDomain || `${fb.projectId}.firebaseapp.com`,
      databaseURL: fb.databaseURL,
      projectId: fb.projectId,
      storageBucket: fb.storageBucket,
      messagingSenderId: fb.messagingSenderId,
      appId: fb.appId || undefined,
    });
  }

  private async fillMissingPreviews(userId: string, threads: ChatThread[]): Promise<ChatThread[]> {
    if (!this.db) return threads;
    const missing = threads.filter((t) => !String(t.lastMessage || '').trim());
    if (!missing.length) return threads;

    const snaps = await Promise.all(
      missing.map((t) => get(ref(this.db!, `chats/${this.safeKey(t.chatId || t.id)}/meta`))),
    );

    const byId = new Map<string, RtdbMeta>();
    missing.forEach((t, i) => {
      const val = snaps[i]?.val() as RtdbMeta | null;
      if (val?.lastMessage) byId.set(t.chatId || t.id, val);
    });
    if (!byId.size) return threads;

    const repairs: Record<string, unknown> = {};
    const filled = threads.map((t) => {
      const meta = byId.get(t.chatId || t.id);
      if (!meta?.lastMessage) return t;
      const lastMessage = String(meta.lastMessage);
      const lastMessageAt = meta.lastMessageAt != null ? String(meta.lastMessageAt) : t.lastMessageAt ?? null;
      repairs[`userChats/${userId}/${this.safeKey(t.chatId || t.id)}/lastMessage`] = lastMessage;
      repairs[`userChats/${userId}/${this.safeKey(t.chatId || t.id)}/lastMessageAt`] = lastMessageAt;
      return { ...t, lastMessage, lastMessageAt };
    });

    try {
      await update(ref(this.db), repairs);
    } catch (error) {
      console.warn('[TYNG Chat] inbox preview repair failed', error);
    }

    return filled;
  }

  private snapshotToThreads(snap: DataSnapshot): ChatThread[] {
    const val = snap.val() as Record<string, RtdbInboxRow> | null;
    if (!val || typeof val !== 'object') {
      return [];
    }

    return Object.entries(val)
      .map(([key, row]) => ({
        ...this.rowToThread(key, row),
        updatedAtMs: Number(row?.updatedAtMs || Date.parse(String(row?.lastMessageAt || '')) || 0),
        pinMs: Number(row?.pinnedAtMs || Date.parse(String(row?.pinnedAt || '')) || 0),
      }))
      .sort((a, b) => {
        const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
        if (pinDiff !== 0) return pinDiff;
        if (a.pinned && b.pinned) return b.pinMs - a.pinMs;
        return b.updatedAtMs - a.updatedAtMs;
      })
      .map(({ updatedAtMs: _u, pinMs: _p, ...thread }) => thread);
  }

  private snapshotToMessages(
    snap: DataSnapshot,
    chatId: string,
    currentUserId: string,
  ): ChatMessage[] {
    const val = snap.val() as Record<string, RtdbMessage> | null;
    if (!val || typeof val !== 'object') {
      return [];
    }

    return Object.entries(val)
      .map(([key, data]) => {
        const senderId = String(data?.senderId ?? '');
        const createdAt =
          data?.createdAt ||
          (data?.createdAtMs ? new Date(Number(data.createdAtMs)).toISOString() : null);
        const sortMs = Number(data?.createdAtMs || Date.parse(createdAt || '') || 0);
        return {
          id: String(data?.id || key),
          messageId: String(data?.id || key),
          chatId,
          text: String(data?.text ?? ''),
          senderId,
          senderName: data?.senderName != null ? String(data.senderName) : null,
          senderAvatar: resolveMediaUrl(data?.senderAvatar != null ? String(data.senderAvatar) : null),
          createdAt,
          isSelf: senderId === String(currentUserId),
          sortMs,
        };
      })
      .sort((a, b) => a.sortMs - b.sortMs)
      .map(({ sortMs: _s, ...msg }) => msg);
  }

  private safeKey(key: string): string {
    return key.replace(/[.#$\[\]]/g, '_');
  }
}
