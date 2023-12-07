module.exports = function(eleventyConfig) {
  // Output directory: _site

  eleventyConfig.addPassthroughCopy("assets/**");
  return {
    dir: {
      includes: "./src/html",
    }
  }
};
