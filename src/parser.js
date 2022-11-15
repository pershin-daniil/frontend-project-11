const parser = new DOMParser();

const toPost = (item) => ({
  title: item.querySelector('title').textContent,
  description: item.querySelector('description').textContent,
  link: item.querySelector('link').textContent,
});

export default (content) => {
  const dom = parser.parseFromString(content, 'application/xml');
  const title = dom.querySelector('title').textContent;
  const description = dom.querySelector('description').textContent;
  const posts = [...dom.querySelectorAll('item')].map(toPost);
  return { title, description, posts };
};
