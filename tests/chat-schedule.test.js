const test = require('node:test');
const assert = require('node:assert/strict');
const ChatSchedule = require('../chat/chat-schedule.js');

test('schedule templates create several future events for a conversation', () => {
    const now = new Date('2026-10-26T08:00:00.000Z');
    const events = ChatSchedule.seed('c-u01-u08', '陳彥哲', now, () => 0);
    assert.equal(events.length, 3);
    assert.ok(events.every((event) => event.conversationId === 'c-u01-u08'));
    assert.ok(events.every((event) => new Date(event.startsAt) > now));
});

test('adding an event stores it under the selected chat', () => {
    const previousStorage = global.localStorage;
    const data = new Map();
    global.localStorage = {
        getItem(key) { return data.get(key) || null; },
        setItem(key, value) { data.set(key, value); }
    };
    try {
        const event = ChatSchedule.add('c-u01-u08', {
            title: '一起喝咖啡',
            startsAt: '2026-11-01T07:00',
            location: '高雄市',
            createdBy: 'u01'
        });
        assert.equal(event.title, '一起喝咖啡');
        assert.equal(ChatSchedule.list('c-u01-u08', '陳彥哲').length, 1);
        assert.equal(ChatSchedule.list('c-u01-u03', '許安琪').length, 3);
    } finally {
        if (previousStorage === undefined) delete global.localStorage;
        else global.localStorage = previousStorage;
    }
});
