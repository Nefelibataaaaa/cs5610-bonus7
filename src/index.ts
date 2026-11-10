// Name: Can Gong
// Course: CS 5610 - Bonus Assignment 7: Pokemon API

import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

// Data model
interface Pokemon {
  id: number;
  name: string;
  species: string;
  health: number;
  level: number;
  owner: string;
}

// In-memory data store, preloaded with one Pokemon
let pokemonList: Pokemon[] = [
  {
    id: 1,
    name: 'Pikachu',
    species: 'Pikachu',
    health: 100,
    level: 25,
    owner: 'Ash'
  }
];

// 1. GET /api/pokemon -> retrieve all Pokemon
app.get('/api/pokemon', (c) => {
  return c.json({
    success: true,
    data: pokemonList
  }, 200);
});

// 2. GET /api/pokemon/:id -> retrieve a specific Pokemon by ID
app.get('/api/pokemon/:id', (c) => {
  const idParam = c.req.param('id');
  const id = Number(idParam);

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID format' }, 400);
  }

  const pokemon = pokemonList.find((p) => p.id === id);
  if (!pokemon) {
    return c.json({ success: false, error: 'Pokemon not found' }, 404);
  }

  return c.json({ success: true, data: pokemon }, 200);
});

// 3. POST /api/pokemon -> create a new Pokemon
app.post('/api/pokemon', async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ success: false, error: 'Invalid JSON payload' }, 400);
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ success: false, error: 'Request body must be a JSON object' }, 400);
  }

  const { id, name, species, owner, health, level } = body;

  // Validation: ID must not be supplied by the client on POST
  if (id !== undefined) {
    return c.json({ success: false, error: 'ID should not be provided on POST' }, 400);
  }

  // Validation: species and owner must not be falsy and must be strings
  if (!species || typeof species !== 'string' || !species.trim()) {
    return c.json({ success: false, error: 'Species is required and must be a non-empty string' }, 400);
  }

  if (!owner || typeof owner !== 'string' || !owner.trim()) {
    return c.json({ success: false, error: 'Owner is required and must be a non-empty string' }, 400);
  }

  // Validation: health and level, if provided, must be numbers
  if (health !== undefined && (typeof health !== 'number' || isNaN(health))) {
    return c.json({ success: false, error: 'Health must be a number' }, 400);
  }

  if (level !== undefined && (typeof level !== 'number' || isNaN(level))) {
    return c.json({ success: false, error: 'Level must be a number' }, 400);
  }

  // Validation: name, if provided, must be a string
  if (name !== undefined && typeof name !== 'string') {
    return c.json({ success: false, error: 'Name must be a string' }, 400);
  }

  // Processing:
  // 1. If name is absent, default to species
  const finalName = (name && name.trim()) ? name.trim() : species.trim();

  // 2. ID, health, and level are randomly generated (health/level use provided values if supplied)
  let finalId: number;
  do {
    finalId = Math.floor(Math.random() * 1_000_000) + 1;
  } while (pokemonList.some((p) => p.id === finalId));
  const finalHealth = health !== undefined ? health : Math.floor(Math.random() * 50) + 50; // 50 - 99
  const finalLevel = level !== undefined ? level : Math.floor(Math.random() * 20) + 1;    // 1 - 20

  const newPokemon: Pokemon = {
    id: finalId,
    name: finalName,
    species: species.trim(),
    health: finalHealth,
    level: finalLevel,
    owner: owner.trim()
  };

  pokemonList.push(newPokemon);

  return c.json({ success: true, data: newPokemon }, 201);
});

// 4. PATCH /api/pokemon/:id -> update the specified Pokemon
app.patch('/api/pokemon/:id', async (c) => {
  const idParam = c.req.param('id');
  const id = Number(idParam);

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID format' }, 400);
  }

  const pokemonIndex = pokemonList.findIndex((p) => p.id === id);
  if (pokemonIndex === -1) {
    return c.json({ success: false, error: 'Pokemon not found' }, 404);
  }

  let body: any;
  try {
    body = await c.req.json();
  } catch (e) {
    return c.json({ success: false, error: 'Invalid JSON payload' }, 400);
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ success: false, error: 'Request body must be a JSON object' }, 400);
  }

  // PATCH must not modify the ID
  if (body.id !== undefined) {
    return c.json({ success: false, error: 'Cannot modify Pokemon ID' }, 400);
  }

  // Data validation
  if (body.species !== undefined && (!body.species || typeof body.species !== 'string' || !body.species.trim())) {
    return c.json({ success: false, error: 'Species cannot be empty' }, 400);
  }

  if (body.owner !== undefined && (!body.owner || typeof body.owner !== 'string' || !body.owner.trim())) {
    return c.json({ success: false, error: 'Owner cannot be empty' }, 400);
  }

  if (body.name !== undefined && (typeof body.name !== 'string' || !body.name.trim())) {
    return c.json({ success: false, error: 'Name must be a non-empty string' }, 400);
  }

  if (body.health !== undefined && (typeof body.health !== 'number' || isNaN(body.health))) {
    return c.json({ success: false, error: 'Health must be a number' }, 400);
  }

  if (body.level !== undefined && (typeof body.level !== 'number' || isNaN(body.level))) {
    return c.json({ success: false, error: 'Level must be a number' }, 400);
  }

  // Update fields
  const targetPokemon = pokemonList[pokemonIndex];
  pokemonList[pokemonIndex] = {
    ...targetPokemon,
    ...(body.name !== undefined && { name: body.name.trim() }),
    ...(body.species !== undefined && { species: body.species.trim() }),
    ...(body.health !== undefined && { health: body.health }),
    ...(body.level !== undefined && { level: body.level }),
    ...(body.owner !== undefined && { owner: body.owner.trim() })
  };

  return c.json({ success: true, data: pokemonList[pokemonIndex] }, 200);
});

// 5. DELETE /api/pokemon/:id -> delete the specified Pokemon
app.delete('/api/pokemon/:id', (c) => {
  const idParam = c.req.param('id');
  const id = Number(idParam);

  if (isNaN(id)) {
    return c.json({ success: false, error: 'Invalid ID format' }, 400);
  }

  const pokemonIndex = pokemonList.findIndex((p) => p.id === id);
  if (pokemonIndex === -1) {
    return c.json({ success: false, error: 'Pokemon not found' }, 404);
  }

  const deletedPokemon = pokemonList.splice(pokemonIndex, 1)[0];

  return c.json({
    success: true,
    message: `Pokemon with ID ${id} deleted successfully`,
    data: deletedPokemon
  }, 200);
});

// Start the server (port 3000)
serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});