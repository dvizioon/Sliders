import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcPath = path.join(root, "data", "slides.json");
const outDir = path.join(root, "data", "slides");

const data = JSON.parse(fs.readFileSync(srcPath, "utf8"));
let slides = data.slides;

function replaceSlide(id, patch) {
  const index = slides.findIndex((s) => s.id === id);
  if (index === -1) throw new Error(`Slide ${id} não encontrado`);
  slides[index] = { ...slides[index], ...patch };
}

function insertAfterId(afterId, newSlides) {
  const index = slides.findIndex((s) => s.id === afterId);
  if (index === -1) throw new Error(`Slide ${afterId} não encontrado`);
  slides.splice(index + 1, 0, ...newSlides);
}

// --- Spring intro: 6 cards → 2 slides de 3 ---
replaceSlide(39, {
  details: [
    "É o framework **mais usado** para backend corporativo no Brasil e no mundo.",
    "Você cria o projeto em [start.spring.io](https://start.spring.io) ou pela IDE."
  ],
  cards: [
    {
      icon: "rocket",
      heading: "O que é",
      body: "Bibliotecas Java que **automatizam** servidor web, JSON, injeção de dependências e conexão com banco."
    },
    {
      icon: "server",
      heading: "Servidor embutido",
      body: "Não precisa instalar Tomcat. Ao rodar o projeto, a API sobe em `http://localhost:8080`."
    },
    {
      icon: "braces",
      heading: "JSON automático",
      body: "Você devolve um objeto Java (`Tarefa`, `Usuario`...) e o Spring transforma em JSON — e o contrário também."
    }
  ]
});

insertAfterId(39, [
  {
    id: 154,
    active: true,
    day: 1,
    type: "cards",
    title: "Spring Boot — REST e ecossistema",
    lead: "Com anotações você expõe rotas HTTP, organiza o código em camadas e usa ferramentas padrão do mercado.",
    cards: [
      {
        icon: "route",
        heading: "REST API",
        body: "Rotas HTTP: `@GetMapping` (buscar), `@PostMapping` (criar), `@PutMapping` (atualizar), `@DeleteMapping` (apagar)."
      },
      {
        icon: "layers",
        heading: "Organização em camadas",
        body: "**Controller** (rotas) → **Service** (regras) → **Repository** (banco). Cada parte com uma responsabilidade."
      },
      {
        icon: "package",
        heading: "Ecossistema",
        body: "Maven/Gradle, JUnit, Spring Data JPA. Padrão em vagas de Java backend, APIs e microsserviços."
      }
    ]
  }
]);

// --- API REST slide: menos conteúdo vertical ---
replaceSlide(151, {
  details: undefined,
  lead:
    "Pensa no backend como um **garçom digital**: o cliente pede numa URL, o Spring processa e devolve **JSON**. O servidor escuta em `localhost:8080`."
});

// --- Camadas: 5 cards → 3 (properties vai pro slide de banco) ---
replaceSlide(150, {
  details: [
    "Cada camada faz **uma coisa só**.",
    "O **Controller** não acessa banco direto — chama o Repository."
  ],
  cards: [
    {
      icon: "route",
      heading: "Controller",
      body: "Porta de entrada HTTP. Recebe `GET /api/tarefa`, chama o Repository e devolve JSON."
    },
    {
      icon: "cog",
      heading: "Service (opcional)",
      body: "Regras de negócio: validar campos, calcular prioridade. Em projetos simples o Controller chama o Repository direto."
    },
    {
      icon: "database",
      heading: "Repository + Model",
      body: "`Tarefa` (model) = dados. `TarefaRepository` = salva e busca no banco com `save()`, `findAll()`."
    }
  ]
});

// --- Novos slides de banco (projeto h2) ---
const dbSlides = [
  {
    id: 156,
    active: true,
    day: 1,
    type: "cards",
    title: "Introdução ao Banco de Dados",
    lead: "Sem banco, a API **perde tudo** ao reiniciar. O banco guarda tarefas, usuários e pedidos de forma **persistente**.",
    cards: [
      {
        icon: "database",
        heading: "Para que serve",
        body: "Armazena dados em **tabelas** (linhas e colunas). A API grava com `save()` e lê com `findAll()`."
      },
      {
        icon: "hard-drive",
        heading: "H2 (desenvolvimento)",
        body: "Banco **em memória** embutido no Spring — zero instalação. Em produção: PostgreSQL, MySQL..."
      },
      {
        icon: "table",
        heading: "Tabela `tarefa`",
        body: "Cada linha = uma tarefa. Colunas: `id`, `nome`, `descricao`, `lembrete`. O JPA cria a tabela a partir da classe."
      }
    ]
  },
  {
    id: 157,
    active: true,
    day: 1,
    type: "split",
    title: "application.properties",
    lead: "Arquivo em `src/main/resources/`. O Spring lê na subida — muda porta ou banco **sem recompilar**.",
    code:
      "spring.application.name=h2\n\nspring.datasource.url=jdbc:h2:mem:techx\nspring.datasource.driverClassName=org.h2.Driver\nspring.datasource.username=daniel\nspring.datasource.password=1234\n\nspring.jpa.hibernate.ddl-auto=update\nspring.jpa.show-sql=true\n\nspring.h2.console.enabled=true\nspring.h2.console.path=/h2-console",
    rules: [
      "`spring.datasource.url` → endereço do banco (`jdbc:h2:mem:techx` = H2 na RAM)",
      "`username` / `password` → credenciais de acesso ao banco",
      "`spring.jpa.hibernate.ddl-auto=update` → JPA cria/atualiza tabelas automaticamente",
      "`spring.jpa.show-sql=true` → exibe o SQL no console (ótimo para aprender)",
      "`spring.h2.console.enabled=true` → painel web em `/h2-console` para ver as tabelas"
    ]
  },
  {
    id: 158,
    active: true,
    day: 1,
    type: "cards",
    title: "JPA — anotações do Model",
    lead: "JPA mapeia classes Java para tabelas. Você anota a entidade e o Hibernate traduz para SQL.",
    cards: [
      {
        icon: "box",
        heading: "@Entity",
        body: "Marca a classe como **entidade** do banco. Cada objeto `Tarefa` vira uma linha na tabela."
      },
      {
        icon: "key",
        heading: "@Id",
        body: "Define a **chave primária** — identificador único de cada registro. Toda tabela precisa de um `@Id`."
      },
      {
        icon: "hash",
        heading: "@GeneratedValue",
        body: "O banco **gera o id sozinho** ao salvar (`IDENTITY` = auto-incremento: 1, 2, 3...)."
      }
    ]
  },
  {
    id: 159,
    active: true,
    day: 1,
    type: "split",
    title: "Model: classe Tarefa",
    lead: "Classe que espelha a tabela. Atributos `private` + getters/setters. Construtor vazio obrigatório para o JPA.",
    code:
      '@Entity\npublic class Tarefa {\n\n  @Id\n  @GeneratedValue(strategy = GenerationType.IDENTITY)\n  private Long id;\n\n  private String nome;\n  private String descricao;\n  private String lembrete;\n\n  public Tarefa() { }\n\n  // getters e setters...\n}',
    rules: [
      "`@Entity` na classe → vira tabela no banco",
      "`@Id` no campo `id` → chave primária",
      "`@GeneratedValue` → id automático ao inserir",
      "Cada atributo `private` vira uma coluna com o mesmo nome"
    ]
  },
  {
    id: 160,
    active: true,
    day: 1,
    type: "split",
    title: "Repository — acesso ao banco",
    lead: "Interface que o Spring **implementa sozinho**. Você não escreve SQL — usa métodos prontos.",
    code:
      "public interface TarefaRepository\n    extends JpaRepository<Tarefa, Long> {\n}",
    rules: [
      "`JpaRepository<Tarefa, Long>` → entidade `Tarefa`, id do tipo `Long`",
      "`findAll()` → retorna todas as tarefas do banco",
      "`save(tarefa)` → insere ou atualiza um registro",
      "`findById(id)` / `deleteById(id)` → busca e apaga por id"
    ]
  },
  {
    id: 161,
    active: true,
    day: 1,
    type: "cards",
    title: "List<Tarefa> — Generics e Collections",
    lead: "`List<Tarefa>` é uma **lista** de objetos Tarefa. O `<Tarefa>` é **genérico**: diz ao Java *o que* a lista guarda.",
    cards: [
      {
        icon: "list",
        heading: "O que é List<Tarefa>",
        body: "**Collection** do pacote `java.util`. Guarda vários objetos do mesmo tipo. Não é array — o tamanho **cresce** conforme você adiciona."
      },
      {
        icon: "git-compare",
        heading: "List vs Array",
        body: "**Array** (`Tarefa[]`) tem tamanho fixo. **List** (`ArrayList`) é flexível — ideal quando a API retorna quantidade variável de registros."
      },
      {
        icon: "braces",
        heading: "No Controller",
        body: "`public List<Tarefa> getTarefas()` → Spring converte a lista em JSON array: `[{\"id\":1,\"nome\":\"...\"}, ...]`."
      }
    ]
  },
  {
    id: 162,
    active: true,
    day: 1,
    type: "split",
    title: "Controller com banco",
    lead: "`@Autowired` injeta o Repository no Controller — você **não** faz `new TarefaRepository()`. O Spring cuida disso.",
    code:
      '@RestController\n@RequestMapping("/api/tarefa")\npublic class TarefaController {\n\n  @Autowired\n  private TarefaRepository tarefaRepository;\n\n  @GetMapping\n  public List<Tarefa> getTarefas() {\n    return tarefaRepository.findAll();\n  }\n\n  @PostMapping\n  public Tarefa criarTarefa(@RequestBody Tarefa tarefa) {\n    return tarefaRepository.save(tarefa);\n  }\n}',
    rules: [
      "`@Autowired` → Spring injeta o Repository automaticamente",
      "`List<Tarefa>` no retorno → JSON array na resposta HTTP",
      "`@RequestBody` → JSON do cliente vira objeto `Tarefa`",
      "`save()` persiste no banco; `findAll()` lê tudo"
    ],
    run: {
      expectedOutput:
        "GET /api/tarefa\n[{\"id\":1,\"nome\":\"Estudar JPA\",\"descricao\":\"...\",\"lembrete\":\"...\"}]\n\nPOST /api/tarefa\nBody: {\"nome\":\"Nova tarefa\",\"descricao\":\"...\",\"lembrete\":\"...\"}\n→ salvo com id gerado pelo banco"
    }
  }
];

const recapIndex = slides.findIndex((s) => s.id === 20);
slides.splice(recapIndex, 0, ...dbSlides);

replaceSlide(20, {
  days: [
    {
      label: "Fundamentos",
      icon: "book-open",
      topics: [
        "Origem do Java, JDK/JRE/JVM e IDEs",
        "Variáveis, tipos primitivos, wrappers e String x char",
        "Bytecode e built-ins"
      ]
    },
    {
      label: "Controle de fluxo",
      icon: "git-branch",
      topics: [
        "Operadores, if, else e else if",
        "switch, for, foreach e while",
        "Atributos, métodos e exercício do Carro",
        "Encapsulamento, pilares, getters/setters e static"
      ]
    },
    {
      label: "Próximos passos",
      icon: "rocket",
      topics: [
        "Spring Boot: API REST, JSON e camadas",
        "Banco de dados, JPA, `@Id` e `application.properties`",
        "`List<Tarefa>`, Repository e projeto completo no Dia 2"
      ]
    }
  ]
});

// --- Modularizar ---
const PART_MAP = {
  1: "00-intro.json",
  101: "00-intro.json",
  102: "00-intro.json",
  2: "00-intro.json",
  3: "00-intro.json",
  4: "00-intro.json",
  29: "01-fundamentos.json",
  30: "01-fundamentos.json",
  5: "01-fundamentos.json",
  6: "01-fundamentos.json",
  7: "01-fundamentos.json",
  8: "01-fundamentos.json",
  9: "01-fundamentos.json",
  10: "01-fundamentos.json",
  142: "01-fundamentos.json",
  11: "01-fundamentos.json",
  12: "02-builtins.json",
  13: "02-builtins.json",
  23: "02-builtins.json",
  24: "02-builtins.json",
  25: "02-builtins.json",
  26: "02-builtins.json",
  31: "02-builtins.json",
  27: "02-builtins.json",
  28: "02-builtins.json",
  152: "03-fluxo.json",
  143: "03-fluxo.json",
  32: "03-fluxo.json",
  145: "03-fluxo.json",
  146: "03-fluxo.json",
  33: "03-fluxo.json",
  34: "03-fluxo.json",
  35: "03-fluxo.json",
  36: "03-fluxo.json",
  37: "03-fluxo.json",
  141: "03-fluxo.json",
  14: "04-oop.json",
  15: "04-oop.json",
  16: "04-oop.json",
  17: "04-oop.json",
  18: "04-oop.json",
  19: "04-oop.json",
  38: "04-oop.json",
  153: "04-oop.json",
  39: "05-spring.json",
  154: "05-spring.json",
  151: "05-spring.json",
  147: "05-spring.json",
  148: "05-spring.json",
  149: "05-spring.json",
  150: "05-spring.json",
  156: "06-database.json",
  157: "06-database.json",
  158: "06-database.json",
  159: "06-database.json",
  160: "06-database.json",
  161: "06-database.json",
  162: "06-database.json",
  20: "07-fechamento.json",
  21: "07-fechamento.json",
  22: "07-fechamento.json"
};

const parts = {};
for (const slide of slides) {
  const file = PART_MAP[slide.id];
  if (!file) {
    console.warn(`Slide ${slide.id} sem part — indo para fechamento`);
    (parts["07-fechamento.json"] ||= []).push(slide);
    continue;
  }
  (parts[file] ||= []).push(slide);
}

const partFiles = Object.keys(parts).sort();
fs.mkdirSync(outDir, { recursive: true });

for (const file of partFiles) {
  fs.writeFileSync(
    path.join(outDir, file),
    JSON.stringify({ slides: parts[file] }, null, 2) + "\n"
  );
}

const deck = {
  meta: data.meta,
  parts: partFiles.map((f) => `data/slides/${f}`)
};

fs.writeFileSync(path.join(root, "data", "deck.json"), JSON.stringify(deck, null, 2) + "\n");

// slides.json consolidado (compat / backup)
fs.writeFileSync(srcPath, JSON.stringify({ meta: data.meta, slides }, null, 2) + "\n");

console.log(`Deck: ${slides.length} slides em ${partFiles.length} arquivos`);


