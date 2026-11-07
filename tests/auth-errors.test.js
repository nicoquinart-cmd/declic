import test from 'node:test';
import assert from 'node:assert/strict';
import {accountError} from '../src/account/auth-errors.js';
test('explique les erreurs Google sans laisser le bouton silencieux',()=>{
 assert.match(accountError({code:'auth/configuration-not-found'}),/Authentication/);
 assert.match(accountError({code:'auth/unauthorized-domain'}),/nicoquinart-cmd.github.io/);
 assert.match(accountError({code:'auth/popup-blocked'}),/Chrome ou Safari/);
 assert.match(accountError({code:'auth/web-storage-unsupported'}),/stockage/);
});
