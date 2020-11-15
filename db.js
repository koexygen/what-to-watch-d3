const input = document.getElementById("movie-name");
const form = document.querySelector("form");
let movieImgPath = "https://image.tmdb.org/t/p/w500/";
let movieBackdropPath = "https://image.tmdb.org/t/p/original/";

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
      handleHover(e, d);
    })
    .on("mouseout", (e, d) => {
      d3.select(".movie_card").style("display", "none");
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

const getMovieDetails = (movieId) => {
  return fetch(
    `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&language=en-US`
  ).then((r) => r.json());
};

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

const handleHover = (e, d) => {
  getMovieDetails(d.id).then((movie) => {
    const title = d.data.title;
    const backdrop = d.data.backdrop_path;
    const poster = d.data.poster_path;
    const genres = movie.genres;
    const description = d.data.overview;
    const releaseDate = d.data.release_date;
    const minutes = movie.runtime;
    const imdbRating = movie.vote_average;
    const budget = movie.budget;
    const revenue = movie.revenue;
    const prodCompanies = movie.production_companies;
    const prodCountries = movie.production_countries;

    const card = d3.select(".movie_card");
    card.select(".movie-title").text(title);
    card.select(".imdb-rating").append("span").text(imdbRating);
    card.select(".movie-avatar").attr("src", movieImgPath + poster);
    card.select(".movie-backdrop").attr("src", movieBackdropPath + backdrop);
    card.select(".year-director").text(`${releaseDate}`);
    card.select(".genres").text(`${genres.map((genre) => ` ${genre.name}`)}`);
    card.select(".text-description").text(description);
    card.select(".minutes").text(minutes);
    card.select(".extra-info").append("span").text(`Budget: $${budget}`);
    card.select(".extra-info").append("span").text(`Revenue: $${revenue}`);
    card
      .select(".extra-info")
      .append("span")
      .text(`Companies: ${prodCompanies.map((comp) => ` ${comp.name}`)}`);
    card
      .select(".extra-info")
      .append("span")
      .text(`Countries: ${prodCountries.map((country) => ` ${country.name}`)}`);
  });
};
