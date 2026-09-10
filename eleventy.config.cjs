module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter('startsWith', (str, prefix) => (
    typeof str === 'string' ? str.startsWith(prefix) : false
  ));
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes"
    }
  };
};
