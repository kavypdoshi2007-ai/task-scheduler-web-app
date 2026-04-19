import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

/**
 * Task Interface
 */
interface Task {
  id: number;
  name: string;
  priority: number;
}

/**
 * Priority Queue (Max Heap) Implementation
 * Mimics std::priority_queue behavior in C++
 */
class PriorityQueue {
  private heap: Task[] = [];

  push(task: Task) {
    this.heap.push(task);
    this.bubbleUpAt(this.heap.length - 1);
  }

  pop(): Task | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();
    
    const max = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDownAt(0);
    return max;
  }

  remove(id: number): boolean {
    const index = this.heap.findIndex(t => t.id === id);
    if (index === -1) return false;
    
    if (index === this.heap.length - 1) {
      this.heap.pop();
      return true;
    }
    
    this.heap[index] = this.heap.pop()!;
    this.bubbleDownAt(index);
    this.bubbleUpAt(index);
    return true;
  }

  getAllSorted(): Task[] {
    return [...this.heap].sort((a, b) => b.priority - a.priority);
  }

  private bubbleUpAt(index: number) {
    while (index > 0) {
      let parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[index].priority <= this.heap[parentIndex].priority) break;
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      index = parentIndex;
    }
  }

  private bubbleDownAt(index: number) {
    while (true) {
      let left = 2 * index + 1;
      let right = 2 * index + 2;
      let largest = index;

      if (left < this.heap.length && this.heap[left].priority > this.heap[largest].priority) {
        largest = left;
      }
      if (right < this.heap.length && this.heap[right].priority > this.heap[largest].priority) {
        largest = right;
      }
      
      if (largest === index) break;
      [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
      index = largest;
    }
  }
}

const pq = new PriorityQueue();
let nextId = 1;

const app = express();
app.use(express.json());

// API Endpoints
app.post('/api/add', (req, res) => {
  const { name, priority } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Task name is required' });
  }
  const task: Task = { 
    id: nextId++, 
    name, 
    priority: parseInt(priority) || 0 
  };
  pq.push(task);
  res.json({ message: 'Task added successfully', task });
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const removed = pq.remove(id);
  if (removed) {
    res.json({ message: 'Task removed' });
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

app.post('/api/execute', (req, res) => {
  const task = pq.pop();
  if (!task) {
    return res.status(404).json({ error: 'No tasks available in queue' });
  }
  console.log(`Executed task: ${task.name}`);
  res.json({ message: 'Task executed', task });
});

app.get('/api/tasks', (req, res) => {
  res.json(pq.getAllSorted());
});

/**
 * Vite Dev Server Integration
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`App running at http://localhost:${PORT}`);
    console.log(`- POST /api/add    (Add task)`);
    console.log(`- POST /api/execute (Execute task)`);
    console.log(`- GET /api/tasks   (List tasks)`);
  });
}

startServer();
