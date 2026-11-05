'use strict';

const crypto = require('crypto');

function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

async function generateCallId() {
  const dateStr = getFormattedDate();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `US-CALL-${dateStr}-${randomSuffix}`;
}

async function generateRequestId() {
  const dateStr = getFormattedDate();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `US-REQ-${dateStr}-${randomSuffix}`;
}

module.exports = {
  generateCallId,
  generateRequestId
};

