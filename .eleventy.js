module.exports = function(eleventyConfig) {
  // Output directory: _site

  eleventyConfig.addPassthroughCopy("assets/**");
  eleventyConfig.addWatchTarget("./src/**");
  return {
    dir: {
      includes: "./src/html" 
    }
  }
};
