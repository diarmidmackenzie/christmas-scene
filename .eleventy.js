module.exports = function(eleventyConfig) {
  // Output directory: _site

  eleventyConfig.addPassthroughCopy("assets/**");
  eleventyConfig.addPassthroughCopy("styles.css");
  eleventyConfig.addWatchTarget("./src/**");
  eleventyConfig.addWatchTarget("styles.css");
  return {
    dir: {
      includes: "./src/html" 
    }
  }
};
