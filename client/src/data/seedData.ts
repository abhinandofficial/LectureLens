import { Course, Concept, PrerequisiteEdge, Question, StudentMastery, RemediationBite, LectureSession, CohortAnalytics, DoubtItem, SlideItem, FilteredVoiceChunk, MasterLectureNotes } from '../types';

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
      hi: 'Har recursive call ko problem choti karni hogi; bina solid Base Case ke, Call Stack overflow ho jayega.',
      ml: 'ഓരോ റിക്കർസീവ് കോളും പ്രശ്നം ചുരുക്കണം; ബേസ് കേസ് (Base Case) ഇല്ലെങ്കിൽ കോൾ സ്റ്റാക്ക് ഓവർഫ്ലോ ഉണ്ടാകും.'
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
      hi: 'Pointer sirf ghar ka pata (address) hai, khud ghar nahi. Memory free karne par pata NULL set karna zaroori hai.',
      ml: 'പോയിന്ററുകൾ വെറും മെമ്മറി വിലാസങ്ങൾ (RAM Addresses) മാത്രമാണ്. മെമ്മറി ഫ്രീ (free) ചെയ്ത ശേഷം പോയിന്റർ NULL ആക്കി മാറ്റണം.'
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
      hi: 'Agar sorted data bina balance ke BST me daala, toh tree ban jaata hai ek lambi Linked List jisme O(N) lagta hai.',
      ml: 'അൺബാലൻസ്ഡ് ആയ ബൈനറി സെർച്ച് ട്രീയിലേക്ക് സോർട്ട് ചെയ്ത ഡാറ്റ നൽകിയാൽ അത് ലിങ്ക്ഡ് ലിസ്റ്റ് പോലെ സ്ലോ ആകും (O(N)).'
    },
    quickCheck: {
      question: 'What is the height of an un-balanced BST after inserting keys [10, 20, 30, 40, 50] sequentially?',
      options: ['5', '2', '3', 'log2(5)'],
      correctIndex: 0,
      explanation: 'Because each key is strictly greater than the previous, each node becomes the right child of its predecessor, creating a 5-node stick of height 5.'
    }
  }
};

export const DEMO_DOUBTS: DoubtItem[] = [
  {
    id: 'd-1',
    studentName: 'Aarav Sharma',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
    question: 'Why does naive recursive Fibonacci take O(2^n) time when there are only n subproblems?',
    conceptId: 'c-rec',
    conceptName: 'Recursion & Recurrence Relations',
    answerEn: 'Because naive recursion recomputes overlapping subproblems repeatedly without memoization. fib(5) computes fib(3) twice, fib(2) three times, and so forth, creating an exponentially branching call tree.',
    answerHi: 'क्योंकि साधारण रिकर्शन बिना मेमोइज़ेशन के एक ही सब-प्रॉब्लम को बार-बार कैलकुलेट करता है, जिससे कॉल ट्री 2^n की तरह फैलता है।',
    answerMl: 'കാരണം മെമ്മോയിസേഷൻ ഇല്ലാതെ സാധാരണ റിക്കർഷൻ ഒരേ സബ്-പ്രോബ്ലം വീണ്ടും വീണ്ടും കണക്കുകൂട്ടുന്നു. ഇത് ഒരു എക്സ്പോണൻഷ്യൽ കോൾ ട്രീ ഉണ്ടാക്കുന്നു.',
    votes: 14,
    createdAt: '2026-10-10T14:30:00.000Z',
    status: 'answered'
  },
  {
    id: 'd-2',
    studentName: 'Diya Patel',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256',
    question: 'What is the exact difference between marking visited on enqueue vs dequeue in BFS?',
    conceptId: 'c-graph',
    conceptName: 'Graph Traversal (BFS & DFS)',
    answerEn: 'Marking visited on enqueue guarantees each reachable vertex is placed in the queue at most once. If you wait until dequeue, multiple unvisited parents discovering the same neighbor will push duplicate entries into the queue.',
    answerHi: 'Enqueue पर विज़िटेड मार्क करने से हर नोड कतार में केवल एक बार जाता है। Dequeue तक रुकने पर कई पड़ोसी एक ही नोड को बार-बार कतार में डाल देते हैं।',
    answerMl: 'Enqueue ചെയ്യുമ്പോൾ വിസിറ്റഡ് ആക്കിയാൽ ഓരോ നോഡും കൃത്യമായി ഒരു തവണ മാത്രമേ ക്യൂവിൽ വരൂ. Dequeue ചെയ്യുന്നതുവരെ കാത്തിരുന്നാൽ ഒരേ നോഡ് പലതവണ ക്യൂവിൽ പ്രവേശിച്ച് മെമ്മറി നിറയും.',
    votes: 21,
    createdAt: '2026-10-10T16:10:00.000Z',
    status: 'answered'
  },
  {
    id: 'd-3',
    studentName: 'Rohan Nair',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
    question: 'Is a dangling pointer still pointing to valid memory after free()?',
    conceptId: 'c-mem',
    conceptName: 'Memory Addressing & Pointers',
    answerEn: 'No. The pointer holds the old address, but that heap block has been marked free by the allocator and can be reallocated to another process. Dereferencing it is dangerous Undefined Behavior.',
    answerHi: 'नहीं! वह पुराना एड्रेस होल्ड करता है, पर मेमोरी एलोकेटर को लौट चुकी है। उसे डीरेफरेंस करने से अनडिफाइंड बिहेवियर या क्रैश होता है।',
    answerMl: 'ഇല്ല. പോയിന്റർ പഴയ അഡ്രസ്സ് നിലനിർത്തുന്നുണ്ടെങ്കിലും ആ മെമ്മറി ബ്ലോക്ക് അലോക്കേറ്റർക്ക് തിരികെ നൽകിക്കഴിഞ്ഞു. അത് റീഡ് ചെയ്യുന്നത് അപകടകരമായ അൺഡിഫൈൻഡ് ബിഹേവിയർ (Undefined Behavior) ആണ്.',
    votes: 9,
    createdAt: '2026-10-10T18:45:00.000Z',
    status: 'answered'
  }
];

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

export const DEMO_SLIDES: SlideItem[] = [
  {
    slideNumber: 1,
    title: '1. Graph Representations: Adjacency Matrix vs. Adjacency List',
    bullets: [
      'Graph G = (V, E) where V is vertices, E is edges',
      'Adjacency Matrix: O(V²) memory space, O(1) edge lookup, inefficient for sparse graphs',
      'Adjacency List: O(V + E) memory space, standard choice for real-world networks',
      'Memory tradeoff: cache spatial locality vs sparse memory overhead'
    ],
    codeSnippet: `// Adjacency List Representation
vector<vector<int>> adj(V);
adj[u].push_back(v); // directed edge u -> v`,
    notes: 'Emphasize that in practical web crawling or social graphs, V > 10^7, making matrix allocation O(V^2) catastrophic.'
  },
  {
    slideNumber: 2,
    title: '2. Breadth-First Search (BFS) & Frontier Traversal',
    bullets: [
      'Level-order exploration outward from source vertex s',
      'Requires explicit FIFO Queue to track traversal frontier',
      'Guarantees shortest path in unweighted graphs',
      'Time Complexity: O(V + E), Space Complexity: O(V)'
    ],
    codeSnippet: `queue<int> q;
q.push(startNode);
visited[startNode] = true;`,
    notes: 'Walk through tree vs graph difference: Graphs have cycles and alternate paths.'
  },
  {
    slideNumber: 3,
    title: '3. The Critical Visited Invariant: Preventing Queue Explosion',
    bullets: [
      'Invariant: A vertex MUST be marked visited when pushed (enqueued), NOT when popped',
      'Delaying mark until dequeue causes duplicate enqueues from shared neighbors',
      'Pathological duplicate growth: queue size expands exponentially up to O(E)',
      'Common exam trap: "Memory Limit Exceeded" caused by late visited assignment'
    ],
    codeSnippet: `// CORRECT PATTERN:
for (int neighbor : adj[curr]) {
  if (!visited[neighbor]) {
    visited[neighbor] = true; // <-- ENQUEUE TIME MARKING!
    q.push(neighbor);
  }
}`,
    notes: 'High-yield midterm concept. 65% of students fail this edge case.'
  },
  {
    slideNumber: 4,
    title: '4. Depth-First Search (DFS) & Activation Stack Frames',
    bullets: [
      'Backtracking traversal following a single branch to maximum depth',
      'Uses the Call Stack or an explicit LIFO Stack',
      'State colors: White (unvisited), Gray (on current path stack), Black (fully processed)',
      'Stack overflow vulnerability on deep degenerate linear graphs (O(V) frames)'
    ],
    codeSnippet: `void dfs(int u, vector<bool>& vis) {
  vis[u] = true;
  for (int v : adj[u]) {
    if (!vis[v]) dfs(v, vis);
  }
}`,
    notes: 'Link back to Tier 0 Call Stacks so students connect memory frames to recursion depth.'
  },
  {
    slideNumber: 5,
    title: '5. Cycle Detection in Directed Graphs & DAGs',
    bullets: [
      'Directed Acyclic Graph (DAG): Directed graph with zero directed cycles',
      'Cycle exists if and only if DFS encounters a "Back-Edge" to an active Gray ancestor node',
      'Topological ordering is only mathematically possible if graph is a DAG',
      'Kahn\'s In-degree Algorithm: iteratively peels nodes with in-degree = 0'
    ],
    codeSnippet: `if (inStack[v]) {
  // Cycle detected! Graph cannot be top-sorted.
  return true;
}`,
    notes: 'Sets up the prerequisite for Kahn\'s algorithm and syllabus topological validation.'
  }
];

export const DEMO_FILTERED_VOICE_CHUNKS: FilteredVoiceChunk[] = [
  {
    id: 'fvc-1',
    timestamp: '02:15',
    slideIndex: 1,
    rawSpeech: 'Okay, uhm, good morning everyone. So, like, today we are getting into Graph Representations. You know, when we look at an Adjacency Matrix, basically it allocates V squared space. If V is a million, uh, that is a terabyte of RAM, right?',
    filteredSpeech: 'Graph representations: An Adjacency Matrix allocates O(V²) space. With one million vertices, matrix allocation requires terabytes of memory, rendering it unusable for sparse real-world graphs. Adjacency lists optimize this to O(V + E).',
    fillerWordsRemoved: ['Okay', 'uhm', 'So', 'like', 'You know', 'basically', 'uh', 'right'],
    category: 'core_concept',
    slideAlignmentScore: 96
  },
  {
    id: 'fvc-2',
    timestamp: '09:40',
    slideIndex: 2,
    rawSpeech: 'Now, uh, moving to slide 2, BFS is like ripples in a pond when you drop a stone. Each ripple is a distance layer. Remember, you must use a FIFO queue here, not a stack.',
    filteredSpeech: 'Analogy: Breadth-First Search operates like expanding ripples in water—each ripple represents a uniform distance layer from the origin. A FIFO queue enforces this level-order discipline.',
    fillerWordsRemoved: ['Now', 'uh', 'like'],
    category: 'analogy',
    slideAlignmentScore: 92
  },
  {
    id: 'fvc-3',
    timestamp: '24:10',
    slideIndex: 3,
    rawSpeech: 'Listen up, this is super important, uhm, listen carefully. In BFS, when you discover a neighbor, mark it visited immediately! Like, if you wait until you pop it from the queue, two different neighbors will see it and push it twice. In dense graphs, your queue will literally explode with duplicates.',
    filteredSpeech: 'Critical Invariant: In BFS, mark nodes as visited immediately upon enqueuing. Delaying until dequeue causes multiple ancestor nodes to push duplicate instances, resulting in exponential memory bloat and Memory Limit Exceeded errors.',
    fillerWordsRemoved: ['Listen up', 'this is super important', 'uhm', 'listen carefully', 'Like', 'literally'],
    category: 'pitfall_warning',
    slideAlignmentScore: 98
  },
  {
    id: 'fvc-4',
    timestamp: '32:05',
    slideIndex: 4,
    rawSpeech: 'Okay guys, so for DFS, remember our previous lecture on Call Stacks? Each recursive DFS call pushes a new activation frame with return pointers. If the graph is a straight chain of 100,000 nodes, boom, stack overflow!',
    filteredSpeech: 'Depth-First Search relies on the call stack. Recursive traversal pushes activation records per depth level. A degenerate path of 100,000 nodes exceeds typical operating system stack limits (~8MB), causing segmentation faults.',
    fillerWordsRemoved: ['Okay guys', 'so', 'remember', 'boom'],
    category: 'core_concept',
    slideAlignmentScore: 94
  },
  {
    id: 'fvc-5',
    timestamp: '41:18',
    slideIndex: 5,
    rawSpeech: 'And finally, uh, on slide 5: Cycle detection. You cannot topologically sort a graph if it has cycles. If Kahn\'s algorithm finishes and the number of sorted nodes is less than V, you know there is a cycle deadlock.',
    filteredSpeech: 'Cycle Invariant: Topological ordering requires a strict Directed Acyclic Graph (DAG). If Kahn\'s in-degree sorting finishes with fewer than V elements in the processed order, a cycle exists.',
    fillerWordsRemoved: ['And finally', 'uh', 'you know'],
    category: 'pitfall_warning',
    slideAlignmentScore: 95
  }
];

export const DEMO_MASTER_LECTURE_NOTES: MasterLectureNotes = {
  id: 'mln-cs201-lec14',
  lectureId: 'lec-14',
  generatedAt: new Date().toISOString(),
  overview: 'This lecture covered Graph Representations, Breadth-First Search (BFS) mechanics, the Enqueue-Time Visited Invariant, Depth-First Search (DFS) stack frames, and Directed Acyclic Graph (DAG) cycle detection using Kahn\'s algorithm. The synthesis combines source slides with transcribed teacher clarifications.',
  slideAndSpeechAlignment: [
    {
      slideNumber: 1,
      slideTitle: 'Graph Representations (Matrix vs List)',
      slidePoints: [
        'Adjacency Matrix requires O(V²) memory; fast O(1) edge check',
        'Adjacency List requires O(V + E) memory; optimal for sparse graphs'
      ],
      teacherSpokenPoints: [
        'Explained why V=1,000,000 leads to terabyte memory exhaustion on matrices',
        'Recommends Adjacency List for 99% of competitive programming and web graphs'
      ],
      divergenceNotes: 'Teacher spent 6 minutes detailing hardware cache line misses during pointer chasing in adjacency list linked nodes.'
    },
    {
      slideNumber: 2,
      slideTitle: 'Breadth-First Search (BFS) Frontier',
      slidePoints: [
        'Level-order traversal using FIFO queue',
        'Guaranteed shortest path on unweighted edges'
      ],
      teacherSpokenPoints: [
        'Used ripple-in-pond mental model for uniform distance layers',
        'Contrasted level-by-level queue expansion against DFS depth exploration'
      ],
      divergenceNotes: 'Emphasized why priority queues are NOT needed unless edge weights are non-uniform.'
    },
    {
      slideNumber: 3,
      slideTitle: 'The Enqueue-Time Visited Invariant',
      slidePoints: [
        'Must mark visited on queue push, NOT on queue pop',
        'Prevents exponential queue memory blowup'
      ],
      teacherSpokenPoints: [
        'Highlighted as the single most frequent midterm code deduction',
        'Demonstrated how diamond graphs duplicate queue entries exponentially without enqueue-time marking'
      ],
      divergenceNotes: 'Teacher live-coded a counterexample on the chalkboard showing queue length reaching 24 on a 6-node graph.',
      keyFormulasOrCode: 'visited[neighbor] = true; // MUST occur before q.push(neighbor)'
    },
    {
      slideNumber: 4,
      slideTitle: 'DFS & Activation Stack Frames',
      slidePoints: [
        'Backtracking depth exploration via recursion or LIFO stack',
        'O(V) worst-case recursion call stack space'
      ],
      teacherSpokenPoints: [
        'Directly connected recursion depth to Tier 0 Call Stack memory limits',
        'Advised using explicit stack vector when graph depth exceeds 50,000'
      ],
      divergenceNotes: 'Referenced Linux 8MB default stack limit vs Windows 1MB thread stack limit.'
    },
    {
      slideNumber: 5,
      slideTitle: 'Cycle Detection & Kahn\'s Topological Sort',
      slidePoints: [
        'Directed Acyclic Graphs (DAG) contain zero cycles',
        'Topological sort valid only when DAG property holds'
      ],
      teacherSpokenPoints: [
        'Proved mathematically why in-degree queue processing fails on cycles',
        'Showed how syllabus module prerequisites mirror Kahn\'s algorithm'
      ],
      divergenceNotes: 'Demonstrated how academic course catalogs reject circular prerequisite loops.'
    }
  ],
  keyTakeaways: [
    'Always use Adjacency Lists unless vertex count is extremely small (V < 500) and edge density is near 100%.',
    'Mark BFS nodes visited when they enter the queue. Marking upon dequeue is a critical bug in cyclic graphs.',
    'DFS call depth is constrained by OS stack frames; deep recursive trees risk stack overflow.',
    'A cycle in a prerequisite graph causes Kahn\'s queue to terminate prematurely before processing all vertices.'
  ],
  detectedExamPitfalls: [
    'Pitfall: Marking BFS visited on dequeue -> results in TLE/MLE due to redundant path queue pushes.',
    'Pitfall: Assuming BST searches are always O(log N) -> without balancing, insertions degrade to O(N).',
    'Pitfall: Omitting base case in DFS recursion -> triggers stack overflow activation frame exhaustion.'
  ]
};

