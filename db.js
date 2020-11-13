const input = document.getElementById("movie-name");
const form = document.querySelector("form");
let movieImgPath = "https://image.tmdb.org/t/p/w500/";

const dims = { width: window.innerWidth, height: 500 };

const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", dims.width + 200)
  .attr("height", dims.height + 200);

const graph = svg
  .append("g")
  .attr("width", dims.width + 200)
  .attr("transform", `translate(${dims.width / 2},100)`);

let moviesData = [];

const stratify = d3
  .stratify()
  .id((d) => d.id)
  .parentId((d) => d.parent);

const tree = d3.tree().nodeSize([85, 500]);

//update data
const update = (data) => {
  const rootNode = stratify(data);
  const treeData = tree(rootNode);

  const nodes = graph.selectAll(".node").data(treeData.descendants());
  const links = graph.selectAll(".link").data(treeData.links());

  const enterNodes = nodes
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`);

  enterNodes
    .append("image")
    .attr("xlink:href", (d) => movieImgPath + d.data.poster_path)
    .attr("x", -42.5)
    .attr("y", -95)
    .attr("width", 85)
    .attr("height", 125);

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

  console.log(nodes, links);
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
        if (idx === 0) searchResult[idx].parent = null;
      });
      moviesData = searchResult;
      update(moviesData);
    });
  }, 300);
});
