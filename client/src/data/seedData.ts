import { Course, Concept, PrerequisiteEdge, Question, StudentMastery, RemediationBite, LectureSession, CohortAnalytics } from '../types';

export const DEMO_COURSE: Course = {
  id: 'course-cs201',
  code: 'CS201',
  title: 'Data Structures & Algorithms',
  description: 'Foundational concepts in memory representation, linear and hierarchical data structures, algorithm analysis, and cycle-free dependency graphs.',
  instructor: 'Prof. Meera Sen',
  totalStudents: 48,
};

export const DEMO_CONCEPTS: Concept[] = [
  // Tier 0 - Foundations
  {
    id: 'c-mem',
    courseId: 'course-cs201',
    name: 'Memory Addressing & Pointers',
    description: 'Byte addressing, stack vs heap allocation, pointer dereferencing, and memory addresses.',
    tier: 0,
    isBottleneck: true,
    status: 'published',
    cohortMastery: 52,
    tags: ['Foundational', 'C/C++', 'Low-Level']
  },
  {
    id: 'c-asymp',
    courseId: 'course-cs201',
    name: 'Asymptotic Analysis & Big-O',
    description: 'Growth rates of functions, worst-case, average-case, amortized complexity, and tight bounds.',
    tier: 0,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 84,
    tags: ['Theory', 'Complexity']
  },

  // Tier 1 - Linear Structures
  {
    id: 'c-arr',
    courseId: 'course-cs201',
    name: 'Contiguous Arrays & Cache Locality',
    description: 'Index arithmetic, O(1) random access, spatial locality, and dynamic array resizing amortized cost.',
    tier: 1,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 91,
    tags: ['Linear', 'Cache']
  },
  {
    id: 'c-ll',
    courseId: 'course-cs201',
    name: 'Linked Lists & Node Pointers',
    description: 'Non-contiguous node chaining, pointer manipulation, singly vs doubly linked variants, and traversal overhead.',
    tier: 1,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 72,
    tags: ['Linear', 'Pointers']
  },
  {
    id: 'c-stack',
    courseId: 'course-cs201',
    name: 'Stacks & Call Stack Frames',
    description: 'LIFO access discipline, push/pop mechanics, parenthesis matching, and execution frame simulation.',
    tier: 1,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 88,
    tags: ['Linear', 'LIFO']
  },
  {
    id: 'c-queue',
    courseId: 'course-cs201',
    name: 'Queues & Circular Buffers',
    description: 'FIFO access discipline, front/rear pointer wrap-around with modulo arithmetic, and buffer saturation.',
    tier: 1,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 79,
    tags: ['Linear', 'FIFO']
  },

  // Tier 2 - Non-linear & Hierarchical
  {
    id: 'c-rec',
    courseId: 'course-cs201',
    name: 'Recursion & Recurrence Relations',
    description: 'Base cases, recursive leap of faith, call stack depth, tree branches, and master theorem analysis.',
    tier: 2,
    isBottleneck: true,
    status: 'published',
    cohortMastery: 38,
    tags: ['Bottleneck', 'Recursion', 'High-Risk']
  },
  {
    id: 'c-tree',
    courseId: 'course-cs201',
    name: 'Binary Trees & Traversals',
    description: 'Root, leaf, parent-child relations, and preorder, inorder, postorder, level-order traversal mechanics.',
    tier: 2,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 65,
    tags: ['Hierarchical', 'Trees']
  },
  {
    id: 'c-bst',
    courseId: 'course-cs201',
    name: 'Binary Search Trees & Invariants',
    description: 'BST property (left < root < right), logarithmic search under balance, and degenerate chain vulnerabilities.',
    tier: 2,
    isBottleneck: true,
    status: 'published',
    cohortMastery: 49,
    tags: ['Search', 'Invariants']
  },
  {
    id: 'c-hash',
    courseId: 'course-cs201',
    name: 'Hash Tables & Collision Resolution',
    description: 'Hash functions, uniform distribution, load factor, separate chaining, and open addressing probing.',
    tier: 2,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 74,
    tags: ['Hashing', 'Constant-Time']
  },

  // Tier 3 - Advanced Structures
  {
    id: 'c-heap',
    courseId: 'course-cs201',
    name: 'Binary Heaps & Priority Queues',
    description: 'Complete binary tree array representation, min/max-heap invariant, swim/sink sift operations, and O(log n) extract.',
    tier: 3,
    isBottleneck: false,
    status: 'published',
    cohortMastery: 60,
    tags: ['Priority', 'Heaps']
  },
  {
    id: 'c-graph',
    courseId: 'course-cs201',
    name: 'Graph Traversal (BFS & DFS)',
    description: 'Adjacency list/matrix, cycle detection using visited sets, queue-driven BFS, and stack/recursion DFS.',
    tier: 3,
    isBottleneck: true,
    status: 'published',
    cohortMastery: 43,
    tags: ['Graphs', 'BFS/DFS', 'Advanced']
  }
];

export const DEMO_EDGES: PrerequisiteEdge[] = [
  // Foundations to Tier 1
  { id: 'e-1', sourceConceptId: 'c-mem', targetConceptId: 'c-arr' },
  { id: 'e-2', sourceConceptId: 'c-mem', targetConceptId: 'c-ll' },
  { id: 'e-3', sourceConceptId: 'c-arr', targetConceptId: 'c-stack' },
  { id: 'e-4', sourceConceptId: 'c-arr', targetConceptId: 'c-queue' },
  
  // Tier 1 to Tier 2
  { id: 'e-5', sourceConceptId: 'c-stack', targetConceptId: 'c-rec' },
  { id: 'e-6', sourceConceptId: 'c-asymp', targetConceptId: 'c-rec' },
  { id: 'e-7', sourceConceptId: 'c-ll', targetConceptId: 'c-tree' },
  { id: 'e-8', sourceConceptId: 'c-rec', targetConceptId: 'c-tree' },
  { id: 'e-9', sourceConceptId: 'c-tree', targetConceptId: 'c-bst' },
  { id: 'e-10', sourceConceptId: 'c-arr', targetConceptId: 'c-hash' },
  { id: 'e-11', sourceConceptId: 'c-asymp', targetConceptId: 'c-hash' },

  // Tier 2 to Tier 3
  { id: 'e-12', sourceConceptId: 'c-arr', targetConceptId: 'c-heap' },
  { id: 'e-13', sourceConceptId: 'c-tree', targetConceptId: 'c-heap' },
  { id: 'e-14', sourceConceptId: 'c-rec', targetConceptId: 'c-graph' },
  { id: 'e-15', sourceConceptId: 'c-queue', targetConceptId: 'c-graph' },
  { id: 'e-16', sourceConceptId: 'c-stack', targetConceptId: 'c-graph' },
];

export const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q-rec-1',
    conceptId: 'c-rec',
    text: 'Consider the recursive Fibonacci implementation: fib(n) = fib(n-1) + fib(n-2) with base cases fib(0)=0, fib(1)=1. Why does this approach run into catastrophic slowdown for n = 45?',
    difficulty: 'foundational',
    options: [
      {
        id: 'opt-rec-1a',
        text: 'The operating system runs out of physical RAM addresses due to heap allocation overhead.',
        isCorrect: false,
        misconceptionTag: 'Heap vs Stack Confusion',
        trapReasoning: 'You assumed recursive calls allocate memory on the dynamic heap. In reality, function invocations only push minimal stack frames onto the execution call stack; the slowdown is purely combinatorial, not heap exhaustion.'
      },
      {
        id: 'opt-rec-1b',
        text: 'The recursion tree recalculates overlapping subproblems exponentially, yielding O(2^n) time complexity.',
        isCorrect: true,
        misconceptionTag: 'None',
        trapReasoning: ''
      },
      {
        id: 'opt-rec-1c',
        text: 'Because each recursive step requires an O(n) array copy to pass the call parameters.',
        isCorrect: false,
        misconceptionTag: 'Pass-by-Value Illusion',
        trapReasoning: 'You assumed primitive integer arguments require array copying. Primitive integers are passed in CPU registers or single stack words in O(1) time.'
      },
      {
        id: 'opt-rec-1d',
        text: 'Because the base case condition is evaluated only after the entire recursion finishes.',
        isCorrect: false,
        misconceptionTag: 'Late Guard Fallacy',
        trapReasoning: 'You believed base cases are checked post-execution. In fact, base cases are guard statements checked at the very entry of every call frame.'
      }
    ],
    explanationSnippet: 'Without memoization or dynamic programming, naive recursion re-computes fib(n-2), fib(n-3), etc., millions of times across a branching tree of depth n.'
  },
  {
    id: 'q-bst-1',
    conceptId: 'c-bst',
    text: 'A student claims: "Searching in any Binary Search Tree with N nodes will always complete in O(log N) time because at each step we eliminate half the remaining nodes." Why is this statement dangerously flawed?',
    difficulty: 'foundational',
    options: [
      {
        id: 'opt-bst-1a',
        text: 'If keys are inserted in strictly sorted order (1, 2, 3, 4, ...), the BST degenerates into a linear linked list with O(N) worst-case search.',
        isCorrect: true,
        misconceptionTag: 'None',
        trapReasoning: ''
      },
      {
        id: 'opt-bst-1b',
        text: 'Because BST search requires visiting both the left and right subtrees at every non-leaf node.',
        isCorrect: false,
        misconceptionTag: 'BST as Generic Binary Tree',
        trapReasoning: 'You treated a Binary Search Tree like an unconstrained Binary Tree traversal. The BST invariant ensures you only traverse one child branch, not both!'
      },
      {
        id: 'opt-bst-1c',
        text: 'Because string comparisons take polynomial time O(N^2) instead of constant time.',
        isCorrect: false,
        misconceptionTag: 'Irrelevant Complexity Attribution',
        trapReasoning: 'You blamed string key comparison overhead instead of examining the fundamental geometric topology of an unbalanced tree.'
      },
      {
        id: 'opt-bst-1d',
        text: 'Because pointers in C++ require disk page swaps which turn logarithmic operations into O(N).',
        isCorrect: false,
        misconceptionTag: 'Virtual Memory Conflation',
        trapReasoning: 'Standard BST in-memory pointers do not incur disk paging unless under extreme memory pressure; the asymptotic flaw is tree height skew.'
      }
    ]
  },
  {
    id: 'q-mem-1',
    conceptId: 'c-mem',
    text: 'What happens when you declare "int* p = (int*)malloc(sizeof(int)); *p = 42; free(p);", and then subsequently attempt to read "*p"?',
    difficulty: 'foundational',
    options: [
      {
        id: 'opt-mem-1a',
        text: 'The pointer p is automatically reset to NULL by the free() function, raising an immediate compile-time syntax check.',
        isCorrect: false,
        misconceptionTag: 'Automatic Cleanup Illusion',
        trapReasoning: 'You believed free() magically clears the pointer variable itself. In reality, free() only releases the heap block; "p" still holds the old memory address (a dangling pointer)!'
      },
      {
        id: 'opt-mem-1b',
        text: 'It triggers Undefined Behavior: the memory has been returned to the allocator and reading it is a dangerous dangling pointer access.',
        isCorrect: true,
        misconceptionTag: 'None',
        trapReasoning: ''
      },
      {
        id: 'opt-mem-1c',
        text: 'It is guaranteed to return 0 because freed memory bytes are zeroed out by the kernel immediately.',
        isCorrect: false,
        misconceptionTag: 'Zero-Fill Assumption',
        trapReasoning: 'Memory allocators rarely zero out memory upon free() for performance reasons; reading freed memory may return stale bits or crash.'
      },
      {
        id: 'opt-mem-1d',
        text: 'The operating system converts the pointer into a stack variable automatically.',
        isCorrect: false,
        misconceptionTag: 'Storage Duration Confusion',
        trapReasoning: 'Heap and stack allocations occupy distinct virtual address regions; the runtime never migrates freed heap pointers to stack space.'
      }
    ]
  },
  {
    id: 'q-graph-1',
    conceptId: 'c-graph',
    text: 'You are implementing Breadth-First Search (BFS) to find the shortest path in an unweighted graph. When should a neighbor node be marked as "visited"?',
    difficulty: 'applied',
    forwardDependentConceptId: 'c-queue',
    options: [
      {
        id: 'opt-graph-1a',
        text: 'Immediately when the node is dequeued and popped from the front of the queue.',
        isCorrect: false,
        misconceptionTag: 'Late-Visit Queue Explosion',
        trapReasoning: 'If you mark visited only upon dequeue, multiple adjacent nodes can discover the same unvisited neighbor and push redundant duplicates into the queue, causing explosive exponential memory bloat and duplicate traversals.'
      },
      {
        id: 'opt-graph-1b',
        text: 'Immediately as soon as the neighbor is discovered and pushed into the queue.',
        isCorrect: true,
        misconceptionTag: 'None',
        trapReasoning: ''
      },
      {
        id: 'opt-graph-1c',
        text: 'Only after all children and descendants of that node have finished their sub-traversals.',
        isCorrect: false,
        misconceptionTag: 'DFS Post-Order Confusion',
        trapReasoning: 'You confused BFS queue traversal with DFS post-order backtracking. In BFS, level-by-level discovery requires immediate marking upon enqueuing.'
      },
      {
        id: 'opt-graph-1d',
        text: 'Never; unweighted graphs do not need a visited set because BFS paths cannot cycle.',
        isCorrect: false,
        misconceptionTag: 'Acyclic Graph Delusion',
        trapReasoning: 'Any undirected or cyclic graph will cause an infinite loop in BFS if nodes are not marked as visited.'
      }
    ]
  }
];

export const DEMO_STUDENT_MASTERY: Record<string, StudentMastery> = {
  'c-arr': {
    conceptId: 'c-arr',
    score: 94,
    stability: 18.5,
    lastReviewedAt: '2026-10-04T10:00:00.000Z',
    status: 'mastered',
    consecutiveSuccesses: 4
  },
  'c-asymp': {
    conceptId: 'c-asymp',
    score: 88,
    stability: 12.0,
    lastReviewedAt: '2026-10-06T10:00:00.000Z',
    status: 'mastered',
    consecutiveSuccesses: 3
  },
  'c-stack': {
    conceptId: 'c-stack',
    score: 82,
    stability: 9.0,
    lastReviewedAt: '2026-10-07T14:30:00.000Z',
    status: 'mastered',
    consecutiveSuccesses: 3
  },
  'c-queue': {
    conceptId: 'c-queue',
    score: 76,
    stability: 6.5,
    lastReviewedAt: '2026-10-05T09:15:00.000Z',
    status: 'developing',
    consecutiveSuccesses: 2
  },
  'c-ll': {
    conceptId: 'c-ll',
    score: 68,
    stability: 4.0,
    lastReviewedAt: '2026-10-03T11:00:00.000Z',
    status: 'developing',
    consecutiveSuccesses: 1
  },
  'c-hash': {
    conceptId: 'c-hash',
    score: 64,
    stability: 3.5,
    lastReviewedAt: '2026-10-02T16:00:00.000Z',
    status: 'developing',
    consecutiveSuccesses: 1
  },
  'c-tree': {
    conceptId: 'c-tree',
    score: 58,
    stability: 2.5,
    lastReviewedAt: '2026-10-01T08:00:00.000Z',
    status: 'at-risk',
    consecutiveSuccesses: 1
  },
  'c-mem': {
    conceptId: 'c-mem',
    score: 48,
    stability: 1.8,
    lastReviewedAt: '2026-09-29T10:00:00.000Z',
    status: 'bottleneck',
    consecutiveSuccesses: 0
  },
  'c-bst': {
    conceptId: 'c-bst',
    score: 45,
    stability: 1.4,
    lastReviewedAt: '2026-09-28T12:00:00.000Z',
    status: 'bottleneck',
    consecutiveSuccesses: 0
  },
  'c-heap': {
    conceptId: 'c-heap',
    score: 42,
    stability: 1.2,
    lastReviewedAt: '2026-09-27T10:00:00.000Z',
    status: 'at-risk',
    consecutiveSuccesses: 0
  },
  'c-graph': {
    conceptId: 'c-graph',
    score: 35,
    stability: 1.0,
    lastReviewedAt: '2026-09-25T15:00:00.000Z',
    status: 'bottleneck',
    consecutiveSuccesses: 0
  },
  'c-rec': {
    conceptId: 'c-rec',
    score: 31,
    stability: 0.8,
    lastReviewedAt: '2026-09-24T18:00:00.000Z',
    status: 'bottleneck',
    consecutiveSuccesses: 0
  }
};

export const DEMO_REMEDIATION_BITES: Record<string, RemediationBite> = {
  'c-rec': {
    conceptId: 'c-rec',
    conceptName: 'Recursion & Recurrence Relations',
    intuition: 'Recursion is simply delegating a smaller slice of the problem to a mirror clone of the same function, stopping strictly when a trivial base case is hit. If you do not guarantee that every recursive step contracts toward the base condition, the call stack grows unbounded until it crashes.',
    analogy: 'Imagine Russian nesting dolls (Matryoshka). Each doll opened contains a slightly smaller identical doll. The process only halts when you hit the solid baby doll inside (the base case). If a doll contained an identical-sized doll, you would open them forever.',
    memoryCue: {
      en: 'Every call must shrink the workload; without a solid base floor, the stack elevator falls through the basement.',
      hi: 'Har recursive call ko problem choti karni hogi; bina solid Base Case ke, Call Stack overflow ho jayega.'
    },
    quickCheck: {
      question: 'Which of the following functions is guaranteed to cause infinite recursion when called with f(5)?',
      options: [
        'int f(int n) { if(n <= 0) return 0; return f(n - 1); }',
        'int f(int n) { if(n == 0) return 0; return f(n + 1); }',
        'int f(int n) { if(n <= 1) return 1; return f(n / 2); }',
        'int f(int n) { return (n <= 0) ? 1 : f(n - 2); }'
      ],
      correctIndex: 1,
      explanation: 'f(n + 1) increases n away from 0 towards positive infinity, so the condition n == 0 will never trigger.'
    }
  },
  'c-mem': {
    conceptId: 'c-mem',
    conceptName: 'Memory Addressing & Pointers',
    intuition: 'A pointer does not store the data itself; it merely holds the numeric house-number (address) of where the data lives in the hardware RAM. Dereferencing a pointer with * is walking to that house and knocking on the door.',
    analogy: 'A sticky note with your friend\'s house address written on it is the pointer. If your friend moves out and the house is demolished (free), the note still exists in your hand, but knocking on the empty lot causes a disaster (dangling pointer).',
    memoryCue: {
      en: 'Pointers are house addresses, not houses. Freeing releases the lot, but leaves the address written on your note until you set it to NULL.',
      hi: 'Pointer sirf ghar ka pata (address) hai, khud ghar nahi. Memory free karne par pata NULL set karna zaroori hai.'
    },
    quickCheck: {
      question: 'If "int x = 10; int* ptr = &x;", what does "*ptr = 25;" do?',
      options: [
        'It changes the address where ptr points to byte 25.',
        'It modifies the value stored in variable x to 25.',
        'It causes a compilation error because x is read-only.',
        'It allocates a new heap block of 25 bytes.'
      ],
      correctIndex: 1,
      explanation: 'The dereference operator * follows the address in ptr to modify the actual value residing in x directly in memory.'
    }
  },
  'c-bst': {
    conceptId: 'c-bst',
    conceptName: 'Binary Search Trees & Invariants',
    intuition: 'A BST stays fast (O(log N)) only when its left and right subtrees maintain balanced depth. When keys arrive in monotonically increasing sequence, the tree has no branches on the left, turning into an expensive linked list.',
    analogy: 'A balanced BST is a well-spread pyramid where you find any person in 4 questions. A degenerate BST is a single-file line of 100 people where you must inspect everyone one-by-one.',
    memoryCue: {
      en: 'Sorted inputs without self-balancing (AVL/Red-Black) stretch your binary search tree into a sluggish linked list.',
      hi: 'Agar sorted data bina balance ke BST me daala, toh tree ban jaata hai ek lambi Linked List jisme O(N) lagta hai.'
    },
    quickCheck: {
      question: 'What is the height of an un-balanced BST after inserting keys [10, 20, 30, 40, 50] sequentially?',
      options: ['5', '2', '3', 'log2(5)'],
      correctIndex: 0,
      explanation: 'Because each key is strictly greater than the previous, each node becomes the right child of its predecessor, creating a 5-node stick of height 5.'
    }
  }
};

export const DEMO_LECTURE: LectureSession = {
  id: 'lec-08',
  courseId: 'course-cs201',
  title: 'Lecture 08: Recursion Trees, Call Stacks & Graph Traversals',
  date: '2026-10-09',
  durationMinutes: 52,
  slidesCount: 24,
  slidesSummary: `Slide 1-4: Review of Call Stack activation records, return addresses, and stack overflow conditions.
Slide 5-9: Divide & Conquer recurrence trees. T(n) = 2T(n/2) + O(n). Master Theorem Case 2.
Slide 10-15: Graph representations — Adjacency Matrix (dense, O(V^2)) vs Adjacency List (sparse, O(V + E)).
Slide 16-20: Breadth-First Search: FIFO Queue, level-order expansion, immediate visited-flag setting to prevent exponential duplicate pushes.
Slide 21-24: Depth-First Search: LIFO recursion, backtracking, cycle detection using 3-color states (White, Gray, Black).`,
  transcript: `[00:02] Good morning class. Today we are bridging two critical pillars of computer science: recursive call frames and graph traversals.
[05:14] Let me remind everyone about the common pitfall we saw in quiz 2. Many students thought that recursive functions allocate memory on the heap. That is incorrect. Each function call pushes a frame onto the hardware call stack with local variables and the instruction pointer.
[12:30] When we move to graphs, notice how DFS naturally borrows the system call stack, whereas BFS must explicitly maintain an external FIFO queue.
[24:10] Pay very close attention here: in BFS, when you discover an adjacent neighbor, you MUST mark it visited at the moment you enqueue it! If you wait until you dequeue it, graph cycles will inject the same node ten times, blowing up your queue memory.
[38:45] For tomorrow's lab, be prepared to implement cycle detection using DFS back-edges. If you encounter a gray node (currently on the recursion stack), you have proven a cycle!`
};

export const DEMO_COHORT_ANALYTICS: CohortAnalytics = {
  courseId: 'course-cs201',
  courseTitle: 'Data Structures & Algorithms (CS201)',
  totalStudents: 48,
  averageMastery: 64.2,
  bottleneckConcepts: [
    {
      id: 'c-rec',
      name: 'Recursion & Recurrence Relations',
      tier: 2,
      averageScore: 31,
      atRiskCount: 29
    },
    {
      id: 'c-graph',
      name: 'Graph Traversal (BFS & DFS)',
      tier: 3,
      averageScore: 35,
      atRiskCount: 26
    },
    {
      id: 'c-mem',
      name: 'Memory Addressing & Pointers',
      tier: 0,
      averageScore: 48,
      atRiskCount: 22
    },
    {
      id: 'c-bst',
      name: 'Binary Search Trees & Invariants',
      tier: 2,
      averageScore: 49,
      atRiskCount: 19
    }
  ],
  misconceptionHeatmap: [
    {
      tag: 'Late-Visit Queue Explosion',
      occurrences: 32,
      conceptName: 'Graph Traversal (BFS)',
      sampleTrap: 'Marking BFS nodes visited on dequeue instead of immediately upon enqueuing.'
    },
    {
      tag: 'Heap vs Stack Confusion',
      occurrences: 28,
      conceptName: 'Recursion & Call Stacks',
      sampleTrap: 'Believing function activation frames are dynamically allocated on the heap.'
    },
    {
      tag: 'Degenerate BST Ignorance',
      occurrences: 21,
      conceptName: 'Binary Search Trees',
      sampleTrap: 'Assuming all BST operations are O(log n) regardless of insertion ordering.'
    },
    {
      tag: 'Automatic Cleanup Illusion',
      occurrences: 19,
      conceptName: 'Memory & Pointers',
      sampleTrap: 'Believing free() automatically sets the pointer variable to NULL.'
    }
  ],
  syllabusDeliveryGap: {
    plannedConcepts: 14,
    deliveredConcepts: 11,
    missingConcepts: [
      'Topological Sorting & Kahn\'s Algorithm (Deferred to Lecture 10)',
      'Disjoint Set Union (DSU) / Kruskal\'s MST',
      'Trie Prefix Trees'
    ],
    transcriptCoveragePct: 78.5
  }
};
