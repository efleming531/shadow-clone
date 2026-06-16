const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { PrismaClient } = require('@prisma/client');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_BASE = `You are Melvin, the AI operating intelligence for The Forge, a full-stack business OS for home services companies built on Node/Express/PostgreSQL/Prisma hosted on Railway. You are talking to Eric, the owner and founder, 22 years old, NJ-based, running AEVUM Roofing as the first live client on the efleming531/shadow-clone repo. Be direct, sharp, no filler. Dry humor. Talk like a senior engineer who gets the business. Never say "Great question". Use markdown code blocks with language tags.`;

const SYSTEM_CODE = `\n\nCODE MODE ACTIVE: Write complete runnable files only. Always prefix code blocks with the file path as a comment. Show plus or minus 5 lines of context for edits. End every response with a ## Summary block listing files changed, commands to run, and how to verify.`;

// All routes require auth + OWNER role
router.use(authenticate, requireRole('OWNER'));

// GET /conversations — list all convos for the logged-in owner
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await prisma.devConversation.findMany({
      where: { ownerId: req.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    res.json(conversations);
  } catch (err) {
    console.error('devStudio GET /conversations:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /conversations — create new conversation
router.post('/conversations', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const conversation = await prisma.devConversation.create({
      data: {
        title: title.trim().slice(0, 100),
        ownerId: req.user.id,
      },
      include: { messages: true },
    });
    res.status(201).json(conversation);
  } catch (err) {
    console.error('devStudio POST /conversations:', err);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// POST /conversations/:id/messages — send a message, call Anthropic, save both
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { messages, model, mode } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const conversation = await prisma.devConversation.findUnique({ where: { id } });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    if (conversation.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const systemPrompt = SYSTEM_BASE + (mode === 'code' ? SYSTEM_CODE : '');
    const modelId = model || 'claude-sonnet-4-6';

    // Ensure messages alternate roles correctly (Anthropic requirement)
    const cleanMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content),
    }));

    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 2048,
      system: systemPrompt,
      messages: cleanMessages,
    });

    const assistantContent = response.content?.[0]?.text || '';
    const stopReason = response.stop_reason;

    // The last message in the array is the user message
    const lastUserMsg = cleanMessages[cleanMessages.length - 1];

    // Save user message + assistant response in a transaction
    await prisma.$transaction([
      prisma.devMessage.create({
        data: {
          conversationId: id,
          role: 'user',
          content: lastUserMsg.content,
          model: modelId,
          mode: mode || 'chat',
        },
      }),
      prisma.devMessage.create({
        data: {
          conversationId: id,
          role: 'assistant',
          content: assistantContent,
          model: modelId,
          mode: mode || 'chat',
          stopReason,
        },
      }),
      prisma.devConversation.update({
        where: { id },
        data: { updatedAt: new Date() },
      }),
    ]);

    res.json({
      content: assistantContent,
      stop_reason: stopReason,
      conversation_id: id,
    });
  } catch (err) {
    console.error('devStudio POST /conversations/:id/messages:', err);
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// DELETE /conversations/:id
router.delete('/conversations/:id', async (req, res) => {
  try {
    const conversation = await prisma.devConversation.findUnique({ where: { id: req.params.id } });
    if (!conversation) return res.status(404).json({ error: 'Not found' });
    if (conversation.ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.devConversation.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('devStudio DELETE /conversations/:id:', err);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

module.exports = router;
