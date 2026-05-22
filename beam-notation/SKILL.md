---
name: beam-notation
description: Use when creating or editing TikZ BEAM (Boxology Extended Annotation Model) diagrams for AI/ML pipeline figures — picking node styles, layout, edges, and (optionally) risk/system annotations. Default target is the ITB thesis (`ta-paper-latex-itb/src/config/ta/if-itb-thesis.sty`), but the concepts apply to any LaTeX/TikZ AI-system diagram.
---

# BEAM Notation

## Source

BEAM = **Boxology Extended Annotation Model** (Ekaputra, Prock, Kiesling, KG-STAR @ ESWC 2025). Builds on van Bekkum et al. extended boxology (2021). Local copy: `references/beam-paper-ekaputra-2025.pdf`. Authoritative ontology: <https://w3id.org/beam/>.

BEAM = boxology visual notation **+ two extensions**:
1. **System perspective** — Container, Note, System, Context, Annotation Connector.
2. **Risk perspective** — Risk, Risk Source, Consequence, Impact, Risk Control.

The thesis port in `if-itb-thesis.sty` now follows the canonical legend (Data=green sharp, Symbol=gray sharp, Statistical/Semantic Model=blue/cyan hexagon, four colored process sub-styles, orange-triangle Actor). Risk/system annotations are *not yet* styled — see "Future extensions" below.

## Concept → TikZ style mapping

The thesis defines these styles (all from `if-itb-thesis.sty`):

| BEAM concept | TikZ style | Visual | Use for |
|---|---|---|---|
| **Data** (Instance) | `beamdata` | green sharp rect, light green fill | datasets, text, vectors, evidence IDs, query, output table |
| **Symbol** (Instance) | `beamsym` | gray sharp rect, gray fill | knowledge graph, taxonomy, ontology, semantic structure |
| **Statistical Model** | `beamml` | blue **hexagon** (chamfered rect), light blue fill | NN, embeddings, classifiers, vector-based retrieval models trained/owned in this work |
| **Semantic Model** | `beamsemmodel` | cyan **hexagon**, light cyan fill | graph-based retrieval, rule/ontology-driven models |
| **Pretrained Model** (thesis ext.) | `beampre` | blue hexagon + **double border** | BGE-M3, off-the-shelf LLM, frozen pretrained KG/index used as-is |
| **Process: Training** | `beamtrain` | **purple** rounded rect | supervised/RL training step |
| **Process: Engineering** | `beameng` | **dark purple** rounded rect | rule definition by human, ontology engineering |
| **Process: Inference** | `beaminf` | **pale yellow** rounded rect with **orange border** | classification, generation, LLM prompting, retrieval scoring step |
| **Process: Transformation** | `beamtrans` | **pink** rounded rect | preprocessing, cleaning, normalization, splitting, mapping |
| **Actor** | `beamactor` | orange **triangle** | user, domain expert, annotator |
| **Contribution** (thesis ext.) | `beamadd` | orange dashed rounded rect | thesis contribution to highlight — use sparingly |
| **Terminator** (thesis ext.) | `beamterm` | gray pill | start/end of a flowchart |
| **Decision** (thesis ext.) | `beamdecision` | gray diamond | branching condition (yes/no) |
| Workflow Connector | `beamarr` | solid arrow, Stealth tip | dataflow / control flow |
| Edge label | `beamlbl` | scriptsize italic, white bg | "ya" / "tidak" / "top-K" |

`beamproc` is kept as an alias for `beamtrans` (back-compat). Prefer the explicit sub-styles in new diagrams.

**Critical distinction — `beamml` vs `beampre`:**
- `beamml` (single border hexagon) → Statistical Model trained / fine-tuned / authored as part of the work.
- `beampre` (**double** border hexagon) → off-the-shelf, frozen, used as-is (BGE-M3, vanilla LLM, pretrained KG index).

**Color palette (already in sty):**
- Data `#6B8E3D` / bg `#D9E8B8`
- Symbol `#5C6B78` / bg `#B8C2CC`
- Statistical Model `#2E86AB` / bg `#B6DDF0`
- Pretrained `#14517A` (border, double over `beamml`)
- Semantic Model `#2BB3C0` / bg `#B8E7EC`
- Training `#8676B1` / bg `#D7CDE8`
- Engineering `#6B4080` / bg `#C7B0D2`
- Inference border `#D88B3F` / bg `#F8E8C8`
- Transformation `#C76A9C` / bg `#F1C8DE`
- Actor `#E89456` / bg `#F8D9BC`
- Contribution `#C2410C` / bg `#FBEADF`
- Util (terminator/decision/arrow) `#6B7280` / bg `#EDEEF0`

## Required envelope

Every BEAM figure MUST be wrapped in `\fitwidth{...}` — `if-itb-thesis.sty` defines it as a resizebox that shrinks to `\linewidth` if needed but never enlarges small diagrams. Without it, wide TikZ pipelines overflow the right margin.

```latex
\begin{figure}[ht]
    \centering
    \fitwidth{%
    \begin{tikzpicture}[node distance=6mm and 12mm]
        % nodes
        % edges
    \end{tikzpicture}%
    }
    \caption{Sentence-case caption.}
    \label{fig:slug-kebab}
\end{figure}
```

`node distance=A and B`: A=vertical, B=horizontal. Typical values 5–8mm vertical, 9–16mm horizontal. Tighter = more compact diagram. Tune per figure.

## Templates

### 1. Linear pipeline (most common)

```latex
\begin{figure}[ht]
    \centering
    \fitwidth{%
    \begin{tikzpicture}[node distance=5mm and 9mm]
        \node[beamdata] (load) {Pemuatan\\ data};
        \node[beamtrans, right=of load] (clean) {Pembersihan};
        \node[beampre, right=of clean] (emb) {\textit{Embedding}\\ BGE-M3};
        \node[beamdata, right=of emb] (store) {\textit{Vector}\\ \textit{store}};
        \node[beaminf, right=of store] (ret) {Kemiripan\\ kosinus top-$K$};
        \node[beamdata, right=of ret] (out) {\textit{Evidence ID}\\ + skor};
        \draw[beamarr] (load)--(clean);
        \draw[beamarr] (clean)--(emb);
        \draw[beamarr] (emb)--(store);
        \draw[beamarr] (store)--(ret);
        \draw[beamarr] (ret)--(out);
    \end{tikzpicture}%
    }
    \caption{Arsitektur \textit{pipeline} \textit{naive RAG}.}
    \label{fig:arsitektur-naive-rag}
\end{figure}
```

### 2. Branching / decision flow

```latex
\begin{tikzpicture}[node distance=7mm and 16mm]
    \node[beamterm, text width=36mm] (start) {Klaim, bukti terambil, skor};
    \node[beamtrans, below=of start, text width=36mm] (ctx) {Susun konteks dan prompt};
    \node[beaminf, below=of ctx, text width=36mm] (llm) {LLM menilai bukti};
    \node[beamdecision, below=of llm, text width=24mm] (suff) {Bukti cukup?};
    \node[beamterm, right=of suff] (abs) {Abstain};
    \node[beamterm, below=of suff] (out) {Supported / Refuted};
    \draw[beamarr] (start)--(ctx);
    \draw[beamarr] (ctx)--(llm);
    \draw[beamarr] (llm)--(suff);
    \draw[beamarr] (suff)--node[beamlbl]{tidak}(abs);
    \draw[beamarr] (suff)--node[beamlbl]{ya}(out);
\end{tikzpicture}
```

### 3. Two-system comparison joining at common module

```latex
\begin{tikzpicture}[node distance=6mm and 14mm]
    \node[beamdata, text width=26mm] (in) {Korpus \textit{evidence} + klaim uji};
    \node[beamml, above right=5mm and 14mm of in] (nr) {\textit{Naive RAG}\\ (vektor)};
    \node[beamsemmodel, below right=5mm and 14mm of in] (lr) {LightRAG\\ (graf)};
    \node[beamdata, right=42mm of in] (ev) {\textit{Evidence ID} top-$K$};
    \node[beampre, right=of ev] (dec) {Modul klasifikasi LLM};
    \node[beamterm, right=of dec] (out) {Supported / Refuted / Abstain};
    \draw[beamarr] (in.east) to[out=25,in=180] (nr.west);
    \draw[beamarr] (in.east) to[out=-25,in=180] (lr.west);
    \draw[beamarr] (nr.east) to[out=0,in=110] (ev.north);
    \draw[beamarr] (lr.east) to[out=0,in=-110] (ev.south);
    \draw[beamarr] (ev)--(dec);
    \draw[beamarr] (dec)--(out);
\end{tikzpicture}
```

### 4. Above/below fan-out

```latex
\node[beamtrans, right=of clean] (split) {Split};
\node[beamml, above right=4mm and 12mm of split] (a) {Branch A};
\node[beamml, below right=4mm and 12mm of split] (b) {Branch B};
\draw[beamarr] (split.east) to[out=20,in=180] (a.west);
\draw[beamarr] (split.east) to[out=-20,in=180] (b.west);
```

## Node-style picker (decision tree)

1. **Is it a flow control element?** → `beamterm` (start/end pill) or `beamdecision` (diamond).
2. **Is it a tangible data artifact?** (text, vectors, IDs, output rows, an index of vectors that's just stored data) → `beamdata`.
3. **Is it symbolic / structural?** (KG, ontology, taxonomy, rules) → `beamsym`.
4. **Is it a model?**
   - Vector-/statistic-based, trained/owned in this work → `beamml` (blue hexagon).
   - Graph-/rule-/ontology-driven model → `beamsemmodel` (cyan hexagon).
   - Pretrained / off-the-shelf / frozen (any flavor) → `beampre` (double border).
5. **Is it a process step?** Pick by *kind*:
   - Training a model → `beamtrain` (pink).
   - Designing/authoring rules/ontology → `beameng` (purple).
   - Running inference / classification / retrieval scoring / LLM generation → `beaminf` (yellow).
   - Cleaning / preprocessing / chunking / mapping / splitting / normalization → `beamtrans` (lavender). **This is the most common process — when in doubt, use `beamtrans`.**
6. **Is it a human / external actor?** → `beamactor` (orange triangle).
7. **Is it a new contribution of the thesis you want to highlight?** → `beamadd` (dashed orange).

**One-shot rule of thumb for LLM nodes:**
- "LLM" as a *model entity* sitting in the architecture → `beampre` (off-the-shelf) or `beamml` (fine-tuned).
- "LLM judges / generates / extracts" as a *step* → `beaminf`.

## Layout rules

- `\\` inside node text = line break. Keep node text short (2–3 lines max).
- `text width=NN mm` enables wrapping for long node text.
- Curved connections: `to[out=A,in=B]` with angles in degrees (0=right, 90=up, 180=left, -90=down). Default straight `--` for orthogonal flow.
- Avoid edges crossing nodes — re-route with `to[out=..,in=..]` or add a bend.
- Caption: sentence-case, ends with period, refers to figure purpose not its structure.
- Label: `fig:` prefix, kebab-case, ASCII only.
- Hexagon chamfer (`beamml`/`beamsemmodel`/`beampre`) uses `chamfered rectangle xsep=4mm` — increase if you want a more pronounced hexagon shape on narrow nodes.

## Build & verify

After editing, compile from `ta-paper-latex-itb/src/`:

```bash
cd ta-paper-latex-itb/src && latexmk -pdf -interaction=nonstopmode thesis.tex
```

Visual check (no `pdftoppm` available — Ghostscript fallback per `reference_thesis_build`). PDF page number = logical chapter page + front-matter offset (currently ~+11 in this thesis), so compute the PDF page from the `\@writefile{lof}` entry in `thesis.aux`:

```bash
gs -q -dNOPAUSE -dBATCH -sDEVICE=png16m -r110 \
   -dFirstPage=N -dLastPage=M \
   -o /tmp/p-%02d.png ta-paper-latex-itb/src/thesis.pdf
```

Then Read the PNGs to confirm the diagram fits and is legible.

## Common pitfalls

- **Missing `\fitwidth{}`** — wide pipeline overflows right margin. Always wrap.
- **Wrong model style** — `beamml` for BGE-M3 or vanilla LLM (should be `beampre`). Trained / authored → `beamml`; pretrained / frozen → `beampre`.
- **Process step picked as `beamml`** — e.g., labelling "LLM extracts entities" as `beamml` makes it look like a model rather than a step. Use `beaminf` for *what the LLM does* and reserve `beamml`/`beampre` for the *model entity itself*.
- **Vector store / index as `beamml`** — those are stored data artifacts, not models. Use `beamdata`. Reserve `beamml` for models.
- **Diagonal arrow without `to[out=,in=]`** — looks crossed/messy. Use curve angles for fan-in/fan-out.
- **Underscores in node text** — escape as `\_` or wrap with `\texttt{...}` / `\textit{...}` that handles it. (Inside `\textit{evidence_id}` will break — use `\textit{evidence ID}` or `\texttt{evidence\_id}`.)
- **Overlapping nodes** — increase `node distance` first; only resize with `\fitwidth` if compact layout fails.
- **Caption inside `\fitwidth`** — caption must be OUTSIDE the resizebox or it shrinks too. Order: `\centering` → `\fitwidth{tikzpicture}` → `\caption` → `\label`.

## Future extensions (not yet styled in `if-itb-thesis.sty`)

Paper defines but thesis does not yet implement:

- **System perspective annotations:** `Container` (grouping with title bar), `Note` (UML-style folded corner), `System` / `Context` (descriptive header blocks), `Annotation Connector` (dashed line with end dot).
- **Risk perspective:** `Risk`, `Risk Source`, `Consequence`, `Impact`, `Risk Control` — all visualized as rectangles with title bar like `Risk: <Title>` over a description.

If/when needed, add styles to `if-itb-thesis.sty`:

```latex
\definecolor{beamRisk}{HTML}{B91C1C}
\definecolor{beamRiskbg}{HTML}{FEE2E2}
\tikzset{
  beamnote/.style={beam, draw=beamUtil, fill=yellow!10, rectangle,
    rounded corners=1pt, minimum width=24mm, inner sep=3pt},
  beamcontainer/.style={beam, draw=beamUtil, dashed, rectangle,
    inner sep=4mm},
  beamrisk/.style={beam, draw=beamRisk, fill=beamRiskbg, rectangle,
    minimum width=30mm, inner sep=3pt},
  beamannconn/.style={dashed, draw=beamUtil, -{Circle[length=1.4mm]}},
}
```

Risk annotations connect to system elements via `beamannconn` (dashed line ending in a dot), distinct from `beamarr` (solid Stealth) used for dataflow.

## Quick checklist when adding a new diagram

1. Open chapter `.tex`, find the figure anchor sentence ("Gambar~\ref{fig:...} menunjukkan...").
2. Sketch flow in text first (nodes left→right or top→bottom; mark decision points).
3. Pick styles using the picker above. For every process node, decide *which kind* of process (Training / Engineering / Inference / Transformation).
4. Set `node distance=A and B`, place anchor node first, then `right=of`/`below=of` chains.
5. Draw edges. Use curves only where straight `--` would cross.
6. Wrap in `\fitwidth{}`. Add caption + label.
7. Compile with `latexmk`. Render with `gs` if needed. Confirm fit and legibility.
