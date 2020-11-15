const input = document.getElementById("movie-name");
const form = document.querySelector("form");
let movieImgPath = "https://image.tmdb.org/t/p/w500/";
let movieBackdropPath = "https://image.tmdb.org/t/p/original/";

const dims = { width: window.innerWidth, height: window.innerHeight / 2 };

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
  .attr("transform", `translate(${dims.width / 2},10)`)
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
      .x((d) => d.x + dims.width / 44)
      .y((d) => (d.parent === null ? d.y + dims.width / (22 * 0.65) : d.y))
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

const tree = d3.tree().nodeSize([dims.width / 21, dims.height / 1.3]);

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
    .attr("width", dims.width / 22)
    .attr("height", dims.width / (22 * 0.65))
    // .attr("transform", (d) => `translate(${dims.width / 22 / 2}, ${0})`)
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
        .x((d) => d.x + dims.width / 44)
        .y((d) => (d.parent === null ? d.y + dims.width / (22 * 0.65) : d.y))
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
    const voteCount = movie.vote_count;
    const budget = movie.budget;
    const revenue = movie.revenue;
    const prodCompanies = movie.production_companies;
    const prodCountries = movie.production_countries;
    const webPage = movie.homepage;
    const status = movie.status;
    const tagLine = movie.tagline;
    const languages = movie.spoken_languages;

    const card = d3.select(".movie_card").html(`<div class="info_section">
        <div class="movie_header">
          <img
            class="locandina movie-avatar"
            src=${movieImgPath + poster}
          />
          <h1 class="movie-title">${title} - <span style="font-family: cursive;font-weight: lighter;">${tagLine}</span></h1>
          

          <div class="flex-info">
            <p class="imdb-rating">
              <a
                href="https://commons.wikimedia.org/wiki/File:IMDB_Logo_2016.svg"
                ><img
                  alt="IMDB Logo"
                  class="imdbIcon"
                  src="https://icons.iconarchive.com/icons/uiconstock/socialmedia/256/IMDb-icon.png"
              /></a>
              <span>${imdbRating} From ${voteCount}</span>
            </p>
            <h4 class="year-director">${releaseDate}</h4>
            <span class="minutes">${minutes} min</span>
            <p class="type genres">${genres.map(
              (genre) => ` ${genre.name}`
            )}</p>
          </div>

          <div class="extra-info">
            <span>Budget: $${budget}</span>
            <span>Revenue: $${revenue}</span>
            <span>Companies: ${prodCompanies.map(
              (comp) => ` ${comp.name}`
            )}</span>
            <span>
                Countries: ${prodCountries.map((country) => ` ${country.name}`)}
            </span>            
            <span>
                Languages: ${languages.map((language) => ` ${language.name}`)}
            </span>
          </div>
        </div>

        <div class="movie_desc">
          <p class="text-description">
            ${description}
          </p>
        </div>
        <div class="movie_social">
          <ul>
            <li class="movie-website">Website: ${webPage}</li>
            <li style="color: ${
              status === "Released" ? "green" : "red"
            }">${status}</li>
            <li><i class="material-icons">chat_bubble</i></li>
          </ul>
        </div>
      </div>
      <div class="img-container blur_back bright_back">
        <img
          class="movie-backdrop"
          src=${movieBackdropPath + backdrop}
          alt=""
        />
      </div>`);
  });
};
