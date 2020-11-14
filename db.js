const input = document.getElementById("movie-name");
const form = document.querySelector("form");
let movieImgPath = "https://image.tmdb.org/t/p/w500/";

const dims = { width: window.innerWidth, height: 800 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.width + 200)
  .attr("height", dims.height + 200)
  .call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [dims.width, dims.height],
      ])
      .scaleExtent([-1, 8])
      .on("zoom", zoomed)
  );

const graph = svg
  .append("g")
  .attr("width", dims.width + 200)
  .attr("transform", `translate(${dims.width / 2},100)`)
  .call(
    d3.drag().on("start", dragStart).on("drag", grabbed).on("end", dragEnd)
  );

function dragStart() {
  // debugger;
  // console.log(event.x, event.y, d.d, d.y);
  d3.select(this).raise();
  graph.attr("cursor", "grabbing");
}

function grabbed(event, d) {
  //update nodes
  d3.select(this)
    .attr("transform", `translate(${event.x}, ${event.y})`)
    .attr("x", (d.x = event.x))
    .attr("y", (d.y = event.y));

  //  update links
  d3.selectAll(".link").attr(
    "d",
    d3
      .linkVertical()
      .x((d) => d.x)
      .y((d) => (d.parent ? d.y - 100 : d.y))
  );
}

function dragEnd() {
  graph.attr("cursor", "grab");
}

function zoomed({ transform }) {
  graph.attr("transform", transform + `translate(${dims.width / 2},100)`);
}

let moviesData = [];

const stratify = d3
  .stratify()
  .id((d) => d.id)
  .parentId((d) => d.parent);

const tree = d3.tree().nodeSize([85, 500]);

//update data
const update = (data) => {
  //clean nodes
  let oldNodes = graph
    .selectAll(".node")
    .data(data, (d) => d)
    .exit()
    .remove();
  //clean parent
  graph.select(".node").remove();

  //clean links
  graph
    .selectAll(".link")
    .data(data, (d) => d.id)
    .exit()
    .remove();

  let rootNode = stratify(data);
  let treeData = tree(rootNode);

  let nodes = graph.selectAll(".node").data(treeData.descendants());
  let links = graph.selectAll(".link").data(treeData.links());

  const enterNodes = nodes
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .call(
      d3.drag().on("start", dragStart).on("drag", grabbed).on("end", dragEnd)
    );

  enterNodes
    .append("image")
    .attr("xlink:href", (d) => movieImgPath + d.data.poster_path)
    .attr("x", -42.5)
    .attr("y", -95)
    .attr("width", 85)
    .attr("height", 125)
    .on("mouseover", (e, d) => {
      d3.select(".movie_card").style("display", "block");
    });

  links
    .enter()
    .append("path")
    .attr("class", "link")
    .attr(
      "d",
      d3
        .linkVertical()
        .x((d) => d.x)
        .y((d) => (d.parent ? d.y - 100 : d.y))
    );
};

// Fetch Requests
const apiKey = "afc2df6ed2b105665b061dcc22c09716";
const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=`;

form.addEventListener("submit", (e) => {
  e.preventDefault();
});

const searchMovie = (query) => {
  return fetch(url + query).then((response) => response.json());
};

let requestTimer;
input.addEventListener("input", (e) => {
  clearTimeout(requestTimer);
  requestTimer = setTimeout(() => {
    searchMovie(e.target.value).then((data) => {
      let searchResult = data.results;

      searchResult.forEach((movie, idx) => {
        searchResult[idx].parent = searchResult[0].id;
        // if (idx === 0) searchResult[idx].parent = null;
      });
      searchResult[0].parent = null;
      moviesData = searchResult;
      update(moviesData);
    });
  }, 300);
});

const handleHover = (e, d) => {};

//movie card
