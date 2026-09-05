module.exports = function (eleventyConfig) {
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
